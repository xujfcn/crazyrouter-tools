// Prompts and probe logic ported from manxue-ai (app/server.py) so results stay comparable.
export const SCENES = ['海边木栈道', '秋日林道', '春日草坡', '雨后湿地', '黄昏公路', '湖畔风车', '热带海岛', '雪山谷地'];
export const PROMPT = `创建一幅独立的 SVG 鹈鹕骑自行车 2D 循环动画。
主角是一只可爱的鹈鹕，有橙色大嘴、踩在踏板上的蹼足，以及微微张开保持平衡的翅膀。
自行车轮子持续转动，脚与踏板动作协调，动画流畅，背景明亮，配色鲜活。
本次场景：{scene}。请为这个场景独立构图。
在画面右下角用可见的 SVG text 元素显示本次校验码：{nonce}。
只返回一个完整的 SVG，可使用内联 CSS 或 SMIL 动画；不要 HTML、JavaScript、外部图片、外部字体或其他外部资源。`;
export const CANDY_PROMPT = `在一个黑色的袋子里放有三种口味的糖果，每种糖果有两种不同的形状（圆形和五角星形，不同的形状靠手感可以分辨）。现已知不同口味的糖和不同形状的数量统计如下表。参赛者需要在活动前决定摸出的糖果数目，那么，最少取出多少个糖果才能保证手中同时拥有不同形状的苹果味和桃子味的糖？（同时手中有圆形苹果味匹配五角星桃子味糖果，或者有圆形桃子味匹配五角星苹果味糖果都满足要求）

| 形状 | 苹果味 | 桃子味 | 西瓜味 |
| 圆形 | 7 | 9 | 8 |
| 五角星形 | 7 | 6 | 4 |`;
// manxue-ai uses 16000. Claude 5 models count their hidden adaptive thinking against the cap
// (measured 7k–16k thinking tokens on the pelican prompt), so 16000 truncates every Claude
// SVG; 32000 is the default here and 16000 stays selectable for manxue-comparable runs.
export const MAX_OUTPUT_TOKENS = 32000;
export const OUTPUT_TOKEN_OPTIONS = [8000, 16000, 32000, 64000];
export const TIMEOUT_MS = 300000;
export const MAX_MODELS = 4;

const NONCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function drawNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, b => NONCE_ALPHABET[b % NONCE_ALPHABET.length]).join('');
}
export function drawScene() { return SCENES[crypto.getRandomValues(new Uint8Array(1))[0] % SCENES.length]; }
export function pelicanPrompt(scene, nonce) { return PROMPT.replace('{scene}', scene).replace('{nonce}', nonce); }

export function candyPasses(text) { return /(?<![\dA-Za-z_.+\-])21(?![\dA-Za-z_]|\.\d)/.test(text || ''); }

export function extractSvg(text) {
  const m = /<svg\b[\s\S]*?<\/svg\s*>/i.exec(text || '');
  return m ? m[0] : null;
}

const BLOCKED_TAGS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'image', 'audio', 'video', 'a']);
const SMIL = new Set(['animate', 'animatetransform', 'animatemotion']);

export function inspectSvg(source, nonce) {
  const checks = { svg: false, animation: false, nonce: false };
  const fail = error => ({ svg: '', checks, error });
  if (/<!DOCTYPE|<!ENTITY|<\?/i.test(source)) return fail('SVG contains a disallowed XML declaration');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length) return fail('SVG is not well-formed XML');
  const root = doc.documentElement;
  if (root.localName !== 'svg') return fail('Root element is not <svg>');
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const tag = el.localName.toLowerCase();
    if (BLOCKED_TAGS.has(tag)) return fail('SVG contains script, external resource or unsafe element');
    for (const attr of el.attributes) {
      const name = attr.localName.toLowerCase();
      const value = attr.value;
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && !value.startsWith('#'))) return fail('SVG contains event handler or external reference');
      if (name === 'attributename') {
        const v = value.toLowerCase();
        if (v.startsWith('on') || v === 'href' || v === 'xlink:href' || v === 'src') return fail('SVG animation targets event or resource attribute');
      }
    }
    if (tag === 'text' && (el.textContent || '').includes(nonce)) checks.nonce = true;
    if (SMIL.has(tag)) checks.animation = true;
  }
  const refs = [...source.matchAll(/url\((.*?)\)/gis)].map(m => m[1].trim().replace(/^["']|["']$/g, ''));
  if (/@import|javascript:|expression\s*\(/i.test(source) || refs.some(r => !r.startsWith('#'))) return fail('SVG contains external or unsafe styles');
  if (/@keyframes\s/.test(source) && /animation(?:-name)?\s*:/.test(source)) checks.animation = true;
  checks.svg = true;
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return { svg: new XMLSerializer().serializeToString(root), checks, error: '' };
}

export function normalizeBase(url) {
  return (url || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
}

export function endpointFor(protocol) { return protocol === 'responses' ? '/v1/responses' : '/v1/chat/completions'; }

// Field names follow manxue-ai's call_model: max_completion_tokens (chat) and
// role-wrapped input + store:false (responses). Do not "simplify" to max_tokens —
// OpenAI's reasoning models reject it with HTTP 400 when called directly.
// Streaming is on for both protocols: edge gateways (Cloudflare 524 at ~100–120 s)
// close non-streaming responses before a long SVG finishes, while an SSE stream
// keeps bytes flowing. The client accumulates the stream into one text.
export function buildRequest({ protocol, model, effort, prompt, maxTokens = MAX_OUTPUT_TOKENS }) {
  if (protocol === 'responses') {
    const body = { model, input: [{ role: 'user', content: prompt }], stream: true, max_output_tokens: maxTokens, store: false };
    if (effort && effort !== 'omit') body.reasoning = { effort };
    return body;
  }
  const body = { model, messages: [{ role: 'user', content: prompt }], stream: true, stream_options: { include_usage: true }, max_completion_tokens: maxTokens };
  if (effort && effort !== 'omit') body.reasoning_effort = effort;
  return body;
}

// Pure SSE accumulator: feed() takes decoded chunks at arbitrary boundaries, result()
// returns { text, usage, finishReason, error }. Only `data:` lines are read; the
// event type of the Responses API is carried inside the JSON (`type`), so `event:`
// lines, comments and [DONE] are ignored. Multi-line `data:` events (several data:
// lines joined with \n per the SSE spec) are not joined — no OpenAI-compatible
// server emits them; each data: line is one JSON document.
export function createStreamAccumulator(protocol) {
  let buffer = '';
  const parts = [];
  let usage = null, finishReason = null, error = null;
  const onData = data => {
    if (data === '[DONE]') return;
    let j;
    try { j = JSON.parse(data); } catch { return; }
    if (protocol === 'responses') {
      const t = j?.type;
      if (t === 'response.output_text.delta') { if (typeof j.delta === 'string') parts.push(j.delta); }
      else if (t === 'response.completed' || t === 'response.incomplete') { usage = extractUsage(j.response) ?? usage; finishReason = j.response?.status ?? finishReason; }
      else if (t === 'response.failed') error = j.response?.error?.message || j.error?.message || 'response.failed';
      else if (t === 'error') error = j.error?.message || j.message || 'stream error';
      return;
    }
    if (j?.error) error = j.error.message || (typeof j.error === 'string' ? j.error : JSON.stringify(j.error));
    const choice = j?.choices?.[0];
    const c = choice?.delta?.content;
    if (typeof c === 'string') parts.push(c);
    else if (Array.isArray(c)) parts.push(c.map(p => (typeof p?.text === 'string' ? p.text : '')).join(''));
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    const u = extractUsage(j);
    if (u) usage = u;
  };
  const onLine = raw => {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (!line || line.startsWith(':')) return;
    if (line.startsWith('data:')) onData(line.slice(5).trim());
  };
  return {
    feed(chunk) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) onLine(line);
    },
    result() {
      if (buffer) { onLine(buffer); buffer = ''; }
      return { text: parts.join(''), usage, finishReason, error };
    },
  };
}

export function extractText(protocol, data) {
  if (protocol === 'responses') {
    if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
    const parts = [];
    for (const item of data?.output || []) for (const c of item?.content || []) if (c?.type === 'output_text' && typeof c.text === 'string') parts.push(c.text);
    return parts.join('');
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(p => (typeof p?.text === 'string' ? p.text : '')).join('');
  return '';
}

export function extractUsage(data) {
  const u = data?.usage;
  if (!u) return null;
  const input = u.prompt_tokens ?? u.input_tokens;
  const output = u.completion_tokens ?? u.output_tokens;
  if (input == null && output == null) return null;
  return { input: input ?? 0, output: output ?? 0 };
}

// Pinned to the top of the picker (when present in the list) and used for the showcase samples.
export const FEATURED_MODELS = ['gpt-6-astra', 'gpt-5', 'claude-opus-5-5', 'claude-fable-5-1', 'deepseek-v4-pro', 'kimi-k3', 'glm-5.3'];

// /api/pricing marks image, video, embedding, rerank, speech and music models as `openai`
// endpoint-capable too, so the picker would otherwise offer models that cannot answer a chat
// prompt. Three rejects: a non-chat endpoint type, a per-call price (quota_type 1 — chat models
// are billed per token), and a name pattern for rows that carry neither signal.
// KEEP IN SYNC with NON_CHAT_ENDPOINT_TYPES / NON_CHAT_NAME_RE in scripts/publish_model_arena_huggingface.py.
export const NON_CHAT_ENDPOINT_TYPES = ['image-generation', 'suno', 'midjourney', 'video', 'audio', 'embedding', 'rerank'];
export const NON_CHAT_NAME_RE = /^aigc-|image|video|cogview|\bocr\b|-ocr|rerank|embedding|whisper|tts|speech|audio|music|sora|veo|kling|seedream|dall-e|flux|midjourney|imagen|suno|^mj_|wan2\.|hailuo|hy-3d|nano-banana/i;

export function isChatModel(m) {
  if (typeof m?.model_name !== 'string' || !m.model_name.trim()) return false;
  const types = Array.isArray(m.supported_endpoint_types) ? m.supported_endpoint_types : [];
  if (types.some(t => NON_CHAT_ENDPOINT_TYPES.includes(t))) return false;
  if (m.quota_type === 1) return false;
  return !NON_CHAT_NAME_RE.test(m.model_name);
}

export function filterPricingModels(payload) {
  return (payload?.data || [])
    .filter(m => Array.isArray(m?.supported_endpoint_types) && m.supported_endpoint_types.includes('openai') && isChatModel(m))
    .map(m => m.model_name)
    .sort((a, b) => a.localeCompare(b));
}

// models.json written by scripts/publish_model_arena_huggingface.py: { generated, models: [...] }.
// The publisher already applies the chat filter; the name rule is re-applied here so a stale
// snapshot cannot resurrect non-chat names.
export function filterSnapshotModels(payload) {
  return [...new Set((Array.isArray(payload?.models) ? payload.models : []).filter(m => typeof m === 'string' && m.trim() && !NON_CHAT_NAME_RE.test(m)))]
    .sort((a, b) => a.localeCompare(b));
}

// Featured models that exist in `models` first (in FEATURED_MODELS order), then the rest sorted.
export function groupModels(models, featured = FEATURED_MODELS) {
  const set = new Set(models);
  const pinned = featured.filter(name => set.has(name));
  const pinnedSet = new Set(pinned);
  const rest = models.filter(name => !pinnedSet.has(name)).sort((a, b) => a.localeCompare(b));
  return { featured: pinned, rest };
}

export function buildCurl(base, body) {
  const protocol = 'input' in body ? 'responses' : 'chat';
  return `curl ${base}${endpointFor(protocol)} \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`;
}

export function upstreamError(status, bodyText) {
  try {
    const j = JSON.parse(bodyText);
    const msg = j?.error?.message || j?.message || j?.error;
    if (typeof msg === 'string' && msg) return `HTTP ${status}: ${msg}`;
  } catch { /* not json */ }
  return `HTTP ${status}: ${String(bodyText || '').slice(0, 300)}`;
}
