import * as core from './core.js';

const lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const T = {
  en: {
    queued: 'Queued', running: 'Running', ok: 'Pass', fail: 'Fail', aborted: 'Aborted', timeout: s => `Timed out after ${s} s`,
    cors: 'The request never reached the server. The endpoint probably does not allow browser (CORS) requests; try Crazyrouter or a CORS-enabled proxy.',
    gateway: s => `The gateway closed the connection after ${s} s because the upstream had not sent a first byte — typical when a model reasons for a long time before emitting anything. The request was aborted upstream and may still be charged; retry, or choose a faster model.`,
    dropped: s => `Connection dropped mid-stream after ${s} s. Whatever arrived before the drop is shown under "Full answer".`,
    noSvg: 'No complete <svg> found in the answer', reasoningExhausted: n => `No answer: the ${n}-token output budget was spent on reasoning (finish_reason=length)`, manual: 'Model list unavailable from this endpoint; type model names separated by commas.',
    loaded: n => `${n} chat-capable models loaded`, snapshot: d => `Model list from snapshot ${d}`.trim(), pick: 'Pick at least one model', probe: 'Pick at least one probe', key: 'Paste an API key first',
    tooMany: `Only the first ${core.MAX_MODELS} models are used`, svgOk: 'SVG safe', anim: 'Animated', nonce: 'Nonce visible',
    candyOk: 'Answer contains 21', candyFail: 'Answer does not contain 21', latency: 'Latency', tokens: 'Tokens', source: 'SVG source', answer: 'Full answer',
    truncated: n => `Output cut off at the ${n}-token cap`,
    pelican: 'Pelican SVG', candy: 'Candy puzzle', featured: 'Featured', allModels: 'All models',
    candyLater: 'Answer contains 21 (later in the full answer; excerpt truncated)', noSample: 'No sample recorded',
    showcaseSub: (scene, nonce, date) => `Scene ${scene} · nonce ${nonce} · run on ${date} through Crazyrouter, Chat Completions, reasoning effort omitted. One recorded answer per model per probe — a sample, not a benchmark.`,
    svgAlt: model => `${model} pelican riding a bicycle SVG`,
    signedIn: (user, usd) => `Signed in as ${user} · balance $${usd}`, trialCredit: usd => `playground credit $${usd}`,
    signInPrompt: 'Sign in to run without an API key', signIn: 'Sign in', register: 'Register',
    modeAccount: 'Account', modeKey: 'API key', playgroundLoaded: n => `${n} playground models loaded`,
    accountHint: 'Account mode sends each request through the Crazyrouter Playground with your signed-in session — no API key needed; only Playground-enabled models are listed and the Chat Completions protocol is used.',
  },
  zh: {
    queued: '排队中', running: '运行中', ok: '通过', fail: '未通过', aborted: '已取消', timeout: s => `${s} 秒超时`,
    cors: '请求没有到达服务器。该接口可能不允许浏览器跨域（CORS）直连，请改用 Crazyrouter 或开启 CORS 的代理。',
    gateway: s => `网关在 ${s} 秒后关闭了连接，因为上游一直没有发出第一个字节——模型在输出前长时间推理时常见。这次请求已在上游中止，仍可能计费；请重试或换一个更快的模型。`,
    dropped: s => `连接在 ${s} 秒后于流传输中途断开。断开前收到的内容见“完整回答”。`,
    noSvg: '回答中没有完整的 <svg>', reasoningExhausted: n => `没有正文：${n} 输出 token 全部耗在推理上（finish_reason=length）`, manual: '该接口拿不到模型列表，请手动输入模型名，多个用逗号分隔。',
    loaded: n => `已加载 ${n} 个支持对话的模型`, snapshot: d => `模型列表来自快照 ${d}`.trim(), pick: '请至少选择一个模型', probe: '请至少选择一个测试项', key: '请先填写 API Key',
    tooMany: `只使用前 ${core.MAX_MODELS} 个模型`, svgOk: 'SVG 安全', anim: '含动画', nonce: '校验码可见',
    candyOk: '回答含 21', candyFail: '回答不含 21', latency: '耗时', tokens: 'Token', source: 'SVG 源码', answer: '完整回答',
    truncated: n => `输出在 ${n} token 上限处被截断`,
    pelican: '鹈鹕骑车 SVG', candy: '糖果题', featured: '精选', allModels: '全部模型',
    candyLater: '回答含 21（出现在完整回答的后半部分，摘录已截断）', noSample: '没有记录到样本',
    showcaseSub: (scene, nonce, date) => `场景 ${scene} · 校验码 ${nonce} · ${date} 经 Crazyrouter 实跑，Chat Completions，未发送推理力度。每个模型每道题只记录一次回答——这是样本，不是基准测试。`,
    svgAlt: model => `${model} 鹈鹕骑自行车 SVG`,
    signedIn: (user, usd) => `已登录：${user} · 余额 $${usd}`, trialCredit: usd => `Playground 额度 $${usd}`,
    signInPrompt: '登录后无需 API Key 即可运行', signIn: '登录', register: '注册',
    modeAccount: '账户', modeKey: 'API Key', playgroundLoaded: n => `已加载 ${n} 个 Playground 模型`,
    accountHint: '账户模式通过 Crazyrouter Playground 用你的登录会话发送请求，无需 API Key；仅列出 Playground 已开放的模型，并固定使用 Chat Completions 协议。',
  },
}[lang];

const $ = id => document.getElementById(id);
const DEFAULT_BASE = 'https://crazyrouter.com';
// A cross-origin TypeError after this long is a gateway timeout, not a CORS refusal.
const GATEWAY_HINT_MS = 60000;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// Site build (crazyrouter.com/tools): assets live under an absolute prefix, the signed-in
// session may replace the API key, and known model names link to their model pages. The
// HuggingFace build sets none of these, so every branch below is a no-op there.
const SITE_MODE = window.ARENA_SITE_MODE === true;
const ASSET_BASE = typeof window.ARENA_ASSET_BASE === 'string' ? window.ARENA_ASSET_BASE : '';
// { "<model name>": { en: "/en/models/<vendor>/<slug>", zh: "/zh/models/<vendor>/<slug>" } } from the site's page feed.
const MODEL_PAGES = window.ARENA_MODEL_PAGES && typeof window.ARENA_MODEL_PAGES === 'object' && !Array.isArray(window.ARENA_MODEL_PAGES) ? window.ARENA_MODEL_PAGES : {};
const PG_ENDPOINT = '/pg/chat/completions';

const state = { models: [], selected: new Set(), manual: false, scene: core.drawScene(), nonce: core.drawNonce(), batch: null, pricingController: null, pendingBase: '', loadedBase: '', objectUrls: [], showcaseUrls: [], timeoutMs: core.TIMEOUT_MS, pricingTimeoutMs: 20000, account: { available: false, mode: 'key', uid: '', username: '' } };
const query = new URLSearchParams(location.search);
const testMode = query.has('test');
if (testMode) {
  // Test-only overrides (?timeout=ms&pricingTimeout=ms); also writable via window.__arena.state.
  for (const [key, param] of [['timeoutMs', 'timeout'], ['pricingTimeoutMs', 'pricingTimeout']]) {
    const v = Number(query.get(param));
    if (v > 0) state[key] = v;
  }
}
const seconds = ms => Number((ms / 1000).toFixed(1));

function accountMode() { return state.account.mode === 'account'; }
function base() { return accountMode() ? DEFAULT_BASE : core.normalizeBase($('base-url').value) || DEFAULT_BASE; }
function protocol() { return accountMode() ? 'chat' : $('protocol').value; }
function maxTokens() { return Number($('max-tokens').value) || core.MAX_OUTPUT_TOKENS; }
function probes() { return [$('probe-pelican').checked && 'pelican', $('probe-candy').checked && 'candy'].filter(Boolean); }
function promptFor(kind) { return kind === 'candy' ? core.CANDY_PROMPT : core.pelicanPrompt(state.scene, state.nonce); }

function selectedModels() {
  const names = state.manual
    ? $('model-manual').value.split(',').map(s => s.trim()).filter(Boolean)
    : [...state.selected];
  return [...new Set(names)];
}

function notice(text, isError = false) {
  const n = $('notice');
  n.textContent = text || '';
  n.hidden = !text;
  n.classList.toggle('error', isError);
}

async function loadModels() {
  if (accountMode()) return loadPlaygroundModels();
  const target = base();
  if (state.pricingController && target === state.pendingBase) return;
  state.pricingController?.abort();
  state.pricingController = null;
  if (target === state.loadedBase) { $('model-status').textContent = T.loaded(state.models.length); return; }
  const controller = new AbortController();
  state.pricingController = controller;
  state.pendingBase = target;
  const timer = setTimeout(() => controller.abort(), state.pricingTimeoutMs);
  $('model-status').textContent = '…';
  try {
    const res = await fetch(target + '/api/pricing', { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const payload = await res.json();
    if (state.pricingController !== controller) return;
    state.models = core.filterPricingModels(payload);
    if (!state.models.length) throw new Error('empty');
    state.manual = false;
    state.loadedBase = target;
    state.selected.clear();
    renderModelList();
    $('model-status').textContent = T.loaded(state.models.length);
    notice('');
  } catch {
    if (state.pricingController !== controller) return;
    // Bundled snapshot (written by the publisher from /api/pricing) covers the default
    // endpoint when the live fetch fails, e.g. while /api/pricing lacks CORS headers.
    // The pricing controller may already be aborted (timeout), so the snapshot fetch
    // gets its own signal; the staleness guard below still applies.
    const snapshot = target === DEFAULT_BASE ? await loadSnapshot() : null;
    if (state.pricingController !== controller) return;
    if (snapshot) {
      state.models = snapshot.models;
      state.manual = false;
      state.loadedBase = target;
      state.selected.clear();
      renderModelList();
      $('model-status').textContent = T.snapshot(snapshot.generated);
      notice('');
    } else {
      state.models = [];
      state.manual = true;
      state.loadedBase = '';
      $('model-list').replaceChildren();
      $('model-status').textContent = '';
      notice(T.manual);
    }
  } finally { clearTimeout(timer); if (state.pricingController === controller) state.pricingController = null; }
  $('model-list').hidden = state.manual;
  $('model-search').hidden = state.manual;
  $('model-manual').hidden = !state.manual;
  updatePreview();
}

async function loadSnapshot() {
  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(5000) : undefined;
    const res = await fetch(ASSET_BASE + 'models.json', { signal, cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    const models = core.filterSnapshotModels(data);
    return models.length ? { models, generated: typeof data?.generated === 'string' ? data.generated : '' } : null;
  } catch { return null; }
}

function renderModelList() {
  const q = $('model-search').value.trim().toLowerCase();
  const list = $('model-list');
  list.replaceChildren();
  const matches = name => !q || name.toLowerCase().includes(q);
  const { featured, rest } = core.groupModels(state.models);
  const option = name => {
    const label = el('label', 'model-option');
    const input = el('input');
    input.type = 'checkbox'; input.value = name; input.checked = state.selected.has(name);
    input.addEventListener('change', () => {
      if (input.checked && state.selected.size >= core.MAX_MODELS) { input.checked = false; notice(T.tooMany); return; }
      if (input.checked) state.selected.add(name); else state.selected.delete(name);
      updatePreview();
    });
    label.append(input, el('span', null, name));
    return label;
  };
  const shownFeatured = featured.filter(matches);
  const shownRest = rest.filter(matches);
  if (shownFeatured.length) {
    list.append(el('div', 'model-group-label', T.featured), ...shownFeatured.map(option));
    if (shownRest.length) list.append(el('div', 'model-group-label', T.allModels));
  }
  list.append(...shownRest.map(option));
}

function updatePreview() {
  const models = selectedModels();
  const kind = probes()[0] || 'pelican';
  const body = core.buildRequest({ protocol: protocol(), model: models[0] || 'MODEL', effort: $('effort').value, prompt: promptFor(kind), maxTokens: maxTokens() });
  $('request-code').textContent = core.buildCurl(base(), body);
  $('nonce-view').textContent = `${state.scene} · ${state.nonce}`;
}

function makeSignal(batchSignal, timeoutMs) {
  if (typeof AbortSignal.any === 'function') return { signal: AbortSignal.any([batchSignal, AbortSignal.timeout(timeoutMs)]), cleanup() {} };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs);
  const onAbort = () => controller.abort();
  batchSignal.addEventListener('abort', onAbort, { once: true });
  return { signal: controller.signal, cleanup() { clearTimeout(timer); batchSignal.removeEventListener('abort', onAbort); } };
}

// Account mode: same-origin Playground endpoint authenticated by the session cookie plus the
// New-Api-User header the backend requires next to it; never an Authorization header.
function requestInit(token) {
  if (accountMode()) return { url: PG_ENDPOINT, credentials: 'include', headers: { 'Content-Type': 'application/json', 'New-Api-User': state.account.uid } };
  return { url: base() + core.endpointFor(protocol()), credentials: 'same-origin', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } };
}

async function runOne(model, kind, token, batchSignal, card) {
  const block = card.probes[kind];
  setStatus(block, 'running');
  const proto = protocol();
  const { url: endpoint, credentials, headers } = requestInit(token);
  const nonce = state.nonce;
  const cap = maxTokens();
  const body = core.buildRequest({ protocol: proto, model, effort: $('effort').value, prompt: promptFor(kind), maxTokens: cap });
  const timeoutMs = state.timeoutMs;
  const { signal, cleanup } = makeSignal(batchSignal, timeoutMs);
  const started = performance.now();
  let res, text, streamed = null, raw = '';
  const acc = core.createStreamAccumulator(proto);
  try {
    res = await fetch(endpoint, { method: 'POST', signal, credentials, headers, body: JSON.stringify(body) });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !res.body || /application\/json/i.test(contentType)) {
      // Errors and gateways that ignore `stream` answer with one JSON document.
      text = await res.text();
    } else {
      // The fetch signal also rejects reader.read() on abort/timeout mid-stream.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          raw += chunk; acc.feed(chunk);
        }
        const tail = decoder.decode();
        raw += tail; acc.feed(tail);
      } finally { reader.releaseLock(); }
      streamed = acc.result();
    }
  } catch (err) {
    const elapsed = performance.now() - started;
    block.latency.textContent = `${T.latency}: ${Math.round(elapsed)} ms`;
    // Once headers have arrived, reader.read() rejects with a plain AbortError whichever
    // signal fired, so discriminate on the signals rather than on err.name.
    const partial = acc.result().text;
    if (partial) { block.answer.textContent = partial; block.answerWrap.hidden = false; }
    if (batchSignal.aborted) showError(block, T.aborted, 'aborted');
    else if (signal.aborted || err?.name === 'TimeoutError') showError(block, T.timeout(seconds(timeoutMs)), 'fail');
    // The browser hides the status of a cross-origin failure. A real CORS refusal fails within
    // milliseconds; a TypeError arriving after a long wait with no headers is a gateway that gave
    // up waiting for the upstream's first byte (a Cloudflare 524 page carries no CORS headers).
    else if (err instanceof TypeError && res === undefined) showError(block, elapsed >= GATEWAY_HINT_MS ? T.gateway(Math.round(elapsed / 1000)) : T.cors, 'fail');
    else if (err instanceof TypeError && elapsed >= GATEWAY_HINT_MS) showError(block, T.dropped(Math.round(elapsed / 1000)), 'fail');
    else showError(block, err?.message || String(err), 'fail');
    return;
  } finally { cleanup(); }
  const latencyMs = performance.now() - started;
  block.latency.textContent = `${T.latency}: ${Math.round(latencyMs)} ms`;
  if (!res.ok) return showError(block, core.upstreamError(res.status, text), 'fail');
  let answer, usage, truncated = false;
  if (streamed && !streamed.text && !streamed.error && raw.trim()) {
    // Streamed content-type but no SSE events: some gateways send one JSON document anyway.
    try { JSON.parse(raw); text = raw; streamed = null; } catch { /* genuinely empty stream */ }
  }
  if (streamed) {
    if (streamed.text) { block.answer.textContent = streamed.text; block.answerWrap.hidden = false; }
    if (streamed.error) return showError(block, `HTTP ${res.status}: ${streamed.error}`, 'fail');
    if (!streamed.text) return showError(block, streamed.finishReason === 'length' ? T.reasoningExhausted(cap) : core.upstreamError(res.status, 'empty stream'), 'fail');
    answer = streamed.text; usage = streamed.usage;
    truncated = streamed.finishReason === 'length' || streamed.finishReason === 'incomplete';
  } else {
    let data;
    try { data = JSON.parse(text); } catch { return showError(block, core.upstreamError(res.status, text), 'fail'); }
    usage = core.extractUsage(data);
    answer = core.extractText(proto, data);
    truncated = data?.choices?.[0]?.finish_reason === 'length' || data?.status === 'incomplete';
  }
  showMeta(block, latencyMs, usage, truncated ? cap : 0);
  renderResult(block, kind, answer, nonce, { model });
}

// Shared by live runs and showcase samples. `candyPass` (samples only) is the verdict stored
// for the full answer; when the stored excerpt no longer contains 21 the pass is kept with a
// note. `objectUrls` collects blob URLs so each owner can revoke its own. `previewSrc`
// (static build only) receives the sanitized SVG and returns the URL to draw instead of a blob.
function renderResult(block, kind, text, nonce, { candyPass = null, objectUrls = state.objectUrls, previewSrc = null, model = '' } = {}) {
  block.answer.textContent = text;
  block.answerWrap.hidden = false;
  if (kind === 'candy') {
    const inExcerpt = core.candyPasses(text);
    const pass = inExcerpt || candyPass === true;
    block.badges.replaceChildren(badge(pass ? (inExcerpt ? T.candyOk : T.candyLater) : T.candyFail, pass));
    setStatus(block, pass ? 'ok' : 'fail');
    return;
  }
  const svg = core.extractSvg(text);
  if (!svg) { block.badges.replaceChildren(badge(T.noSvg, false)); setStatus(block, 'fail'); return; }
  const result = core.inspectSvg(svg, nonce);
  block.source.textContent = svg;
  block.sourceWrap.hidden = false;
  if (result.error) { block.badges.replaceChildren(badge(result.error, false)); setStatus(block, 'fail'); return; }
  block.badges.replaceChildren(badge(T.svgOk, true), badge(T.anim, result.checks.animation), badge(T.nonce, result.checks.nonce));
  // Rendered as an <img> from an image/svg+xml blob so the browser parses it as XML,
  // exactly as inspectSvg did. Re-parsing the same bytes as HTML (srcdoc) would let
  // CDATA or foreign-content breakouts turn inspected text into live elements.
  // A prerendered page points the same <img> at the sanitized SVG written to a file.
  const img = el('img', 'svg-preview');
  img.alt = T.svgAlt(model);
  if (typeof previewSrc === 'function') img.src = previewSrc(result.svg);
  else { img.src = URL.createObjectURL(new Blob([result.svg], { type: 'image/svg+xml' })); objectUrls.push(img.src); }
  block.preview.replaceChildren(img);
  setStatus(block, result.checks.animation && result.checks.nonce ? 'ok' : 'fail');
}

function badge(text, pass) { return el('span', 'badge ' + (pass ? 'pass' : 'fail'), text); }
function setStatus(block, s) { block.status.textContent = T[s]; block.status.className = 'pill ' + s; }
function showError(block, message, s) { block.error.textContent = message; block.error.hidden = false; setStatus(block, s); }
function showMeta(block, latencyMs, usage, truncatedAt) {
  block.latency.textContent = latencyMs == null ? '' : `${T.latency}: ${Math.round(latencyMs)} ms`;
  block.tokens.textContent = [usage ? `${T.tokens}: ${usage.input} in / ${usage.output} out` : '', truncatedAt ? T.truncated(truncatedAt) : ''].filter(Boolean).join(' · ');
}

// Model names are text; only names on the build-time ARENA_MODEL_PAGES map become a link (page of the current language),
// so nothing in samples.json or a response can mint an anchor.
function modelPagePath(model) {
  const entry = Object.prototype.hasOwnProperty.call(MODEL_PAGES, model) ? MODEL_PAGES[model] : null;
  const href = entry && typeof entry === 'object' ? entry[lang] || entry.en : null;
  return typeof href === 'string' && /^\/[a-z0-9/._-]+$/i.test(href) ? href : null;
}

function modelHeading(model) {
  const h = el('h3');
  const href = modelPagePath(model);
  if (href) { const a = el('a', 'model-link', model); a.href = 'https://crazyrouter.com' + href + (href.includes('?') ? '&' : '?') + 'utm_source=github&utm_medium=github_pages&utm_campaign=' + encodeURIComponent('model-arena') + '&utm_content=model_link'; h.append(a); }
  else h.textContent = model;
  return h;
}

function buildCard(model, kinds, container = $('results')) {
  const card = el('article', 'model-card');
  card.append(modelHeading(model));
  const probesMap = {};
  for (const kind of kinds) {
    const wrap = el('section', 'probe');
    const head = el('div', 'probe-head');
    const status = el('span', 'pill queued', T.queued);
    head.append(el('strong', null, T[kind]), status);
    const latency = el('span', 'meta'), tokens = el('span', 'meta');
    const meta = el('div', 'meta-row'); meta.append(latency, tokens);
    const badges = el('div', 'badges');
    const preview = el('div', 'preview');
    const error = el('div', 'error'); error.hidden = true;
    const answerWrap = el('details'); answerWrap.hidden = true; answerWrap.append(el('summary', null, T.answer)); const answer = el('pre'); answerWrap.append(answer);
    const sourceWrap = el('details'); sourceWrap.hidden = true; sourceWrap.append(el('summary', null, T.source)); const source = el('pre'); sourceWrap.append(source);
    wrap.append(head, meta, badges, preview, error, answerWrap, sourceWrap);
    card.append(wrap);
    probesMap[kind] = { status, latency, tokens, badges, preview, error, answer, answerWrap, source, sourceWrap };
  }
  container.append(card);
  return { card, probes: probesMap };
}

// samples.json (written by scripts/build_model_arena_samples.cjs) is data, never markup:
// every string goes through textContent and every SVG through inspectSvg before it becomes
// an <img> blob, exactly like a live answer. Any failure leaves the section hidden.
// A prerendered page (site build, data-prerendered on #showcase) already carries this markup.
async function loadShowcase() {
  if ($('showcase').dataset.prerendered) return;
  let data;
  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(8000) : undefined;
    const res = await fetch(ASSET_BASE + 'samples.json', { signal, cache: 'no-cache' });
    if (!res.ok) return;
    data = await res.json();
  } catch { return; }
  renderShowcase(data);
}

// Renders samples.json into #showcase; also the static-build entry (window.__arena.renderStatic)
// where `previewSrc(model, svg)` returns the URL of the sanitized SVG file to draw. Returns the
// sanitized SVG per model so the build can write those files.
function renderShowcase(data, { previewSrc = null } = {}) {
  const svgs = {};
  const samples = (Array.isArray(data?.models) ? data.models : []).filter(s => typeof s?.model === 'string' && s.model.trim());
  if (!samples.length || typeof data.nonce !== 'string') return { svgs };
  const grid = $('showcase-grid');
  grid.replaceChildren();
  for (const u of state.showcaseUrls) URL.revokeObjectURL(u);
  state.showcaseUrls = [];
  for (const sample of samples) {
    const card = buildCard(sample.model, ['pelican', 'candy'], grid);
    for (const kind of ['pelican', 'candy']) {
      const block = card.probes[kind];
      const r = sample[kind];
      if (!r || typeof r !== 'object') { showError(block, T.noSample, 'fail'); continue; }
      const text = typeof r.text === 'string' ? r.text : '';
      const usage = r.usage && Number.isFinite(r.usage.input) && Number.isFinite(r.usage.output) ? r.usage : null;
      const cap = Number.isFinite(r.max_output_tokens) ? r.max_output_tokens : core.MAX_OUTPUT_TOKENS;
      showMeta(block, Number.isFinite(r.latency_ms) ? r.latency_ms : null, usage, r.finish === 'length' ? cap : 0);
      if (typeof r.error === 'string' && r.error) {
        if (text) { block.answer.textContent = text; block.answerWrap.hidden = false; }
        showError(block, r.error, 'fail');
        continue;
      }
      const staticSrc = typeof previewSrc === 'function' ? svg => { svgs[sample.model] = svg; return previewSrc(sample.model, svg); } : null;
      renderResult(block, kind, text, data.nonce, { candyPass: r.pass === true, objectUrls: state.showcaseUrls, previewSrc: staticSrc, model: sample.model });
    }
    if (typeof sample.note === 'string' && sample.note) card.card.append(el('p', 'hint', sample.note));
  }
  const date = typeof data.generated === 'string' ? data.generated.slice(0, 10) : '';
  $('showcase-sub').textContent = T.showcaseSub(typeof data.scene === 'string' ? data.scene : '', data.nonce, date);
  $('showcase').hidden = false;
  return { svgs };
}

async function run() {
  const token = $('token').value.trim();
  const all = selectedModels();
  const models = all.slice(0, core.MAX_MODELS);
  const kinds = probes();
  if (!token && !accountMode()) return notice(T.key, true);
  if (!models.length) return notice(T.pick, true);
  if (!kinds.length) return notice(T.probe, true);
  notice(all.length > core.MAX_MODELS ? T.tooMany : '');
  state.scene = core.drawScene(); state.nonce = core.drawNonce();
  updatePreview();
  for (const u of state.objectUrls) URL.revokeObjectURL(u);
  state.objectUrls = [];
  $('results').replaceChildren();
  $('empty').hidden = true;
  const controller = new AbortController();
  state.batch = controller;
  $('run').disabled = true; $('cancel').disabled = false;
  try {
    const jobs = [];
    for (const model of models) {
      const card = buildCard(model, kinds);
      for (const kind of kinds) jobs.push(runOne(model, kind, token, controller.signal, card));
    }
    await Promise.allSettled(jobs);
  } finally {
    $('run').disabled = false; $('cancel').disabled = true;
    state.batch = null;
  }
}

// ---------- Account mode (site build only) ----------

// The main app persists the signed-in user's id in localStorage (`uid`, or `user.id` from the
// classic UI); the backend requires it as New-Api-User on every session-authenticated call.
function readUid() {
  try {
    const uid = localStorage.getItem('uid');
    if (uid) return String(uid);
    const id = JSON.parse(localStorage.getItem('user') || 'null')?.id;
    return id == null || id === '' ? '' : String(id);
  } catch { return ''; }
}

const usd = quota => (Number(quota) / 500000).toFixed(2);

async function apiGet(path, uid) {
  const res = await fetch(path, { credentials: 'include', headers: { 'New-Api-User': uid }, cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const payload = await res.json();
  if (!payload?.success || !payload.data || typeof payload.data !== 'object') throw new Error('unexpected payload');
  return payload.data;
}

function setMode(mode) {
  state.account.mode = mode;
  const account = mode === 'account';
  $('connection-auth').hidden = account;
  const keyHint = $('key-hint'); if (keyHint) keyHint.hidden = account;
  $('protocol').disabled = account;
  if (account) $('protocol').value = 'chat';
  for (const input of document.querySelectorAll('#mode-toggle input')) input.checked = input.value === mode;
  $('account-hint').hidden = !account;
  state.loadedBase = '';
  state.selected.clear();
  loadModels();
  updatePreview();
}

async function loadPlaygroundModels() {
  $('model-status').textContent = '…';
  let models = [];
  try {
    const config = await apiGet('/api/playground/config', state.account.uid);
    models = core.filterSnapshotModels({ models: config.models });
  } catch { models = []; }
  if (!accountMode()) return;
  state.models = models;
  state.manual = !models.length;
  state.loadedBase = '';
  state.selected.clear();
  $('model-list').replaceChildren();
  if (models.length) { renderModelList(); $('model-status').textContent = T.playgroundLoaded(models.length); notice(''); }
  else { $('model-status').textContent = ''; notice(T.manual); }
  $('model-list').hidden = state.manual;
  $('model-search').hidden = state.manual;
  $('model-manual').hidden = !state.manual;
  updatePreview();
}

function buildAccountBar() {
  const editor = document.querySelector('.panel.editor');
  const auth = editor.querySelector('.connection');
  auth.id = 'connection-auth';
  const bar = el('div', 'account-bar'); bar.id = 'account-bar';
  const status = el('span', 'account-status'); status.id = 'account-status';
  const toggle = el('div', 'mode-toggle'); toggle.id = 'mode-toggle'; toggle.setAttribute('role', 'radiogroup'); toggle.hidden = true;
  for (const [value, label] of [['account', T.modeAccount], ['key', T.modeKey]]) {
    const l = el('label');
    const input = el('input'); input.type = 'radio'; input.name = 'arena-mode'; input.value = value;
    input.addEventListener('change', () => { if (input.checked) setMode(value); });
    l.append(input, el('span', null, label));
    toggle.append(l);
  }
  bar.append(status, toggle);
  const hint = el('p', 'hint'); hint.id = 'account-hint'; hint.hidden = true; hint.textContent = T.accountHint;
  editor.insertBefore(bar, auth);
  editor.insertBefore(hint, auth);
  return { status, toggle };
}

function showSignedOut(status) {
  status.replaceChildren();
  status.append(el('span', null, T.signInPrompt + ' '));
  const login = el('a', 'account-link', T.signIn); login.href = 'https://crazyrouter.com/login?utm_source=github&utm_medium=github_pages&utm_campaign=model-arena&utm_content=sign_in';
  const register = el('a', 'account-link', T.register); register.href = 'https://crazyrouter.com/register?utm_source=github&utm_medium=github_pages&utm_campaign=model-arena&utm_content=register';
  status.append(login, ' · ', register);
}

async function initAccount() {
  const { status, toggle } = buildAccountBar();
  const uid = readUid();
  let user = null;
  if (uid) { try { user = await apiGet('/api/user/self', uid); } catch { user = null; } }
  if (!user || typeof user.username !== 'string') { showSignedOut(status); return; }
  state.account = { available: true, mode: 'account', uid, username: user.username };
  const parts = [T.signedIn(user.username, usd(user.quota))];
  try {
    const credit = await apiGet('/api/playground/credit', uid);
    if (Number(credit.remaining_quota) > 0) parts.push(T.trialCredit(usd(credit.remaining_quota)));
  } catch { /* balance line is enough */ }
  status.textContent = parts.join(' · ');
  toggle.hidden = false;
  setMode('account');
}

$('run').addEventListener('click', run);
$('cancel').addEventListener('click', () => state.batch?.abort());
let pricingTimer;
$('base-url').addEventListener('input', () => { clearTimeout(pricingTimer); pricingTimer = setTimeout(loadModels, 600); });
$('model-search').addEventListener('input', renderModelList);
for (const id of ['protocol', 'effort', 'max-tokens', 'probe-pelican', 'probe-candy', 'model-manual']) $(id).addEventListener('input', updatePreview);
$('copy').addEventListener('click', () => navigator.clipboard?.writeText($('request-code').textContent));
$('cancel').disabled = true;
if (SITE_MODE) initAccount().then(() => { if (!state.account.available) loadModels(); });
else loadModels();
loadShowcase();
updatePreview();

if (testMode) window.__arena = { core, state, renderStatic: renderShowcase };
