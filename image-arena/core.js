// Pure helpers for the Image Arena page: request builder, response parser, model filters and
// the path guard for gallery.json. No DOM access so scripts/verify_image_arena_huggingface.cjs
// can exercise everything through the ?test=1 hook.
export const TIMEOUT_MS = 300000;
export const MAX_MODELS = 4;
export const DEFAULT_SIZE = '1024x1024';
export const SIZES = ['1024x1024', '1024x1536', '1536x1024'];

// Models in the gallery. /api/pricing tags most of them `image-generation`; kling, cogview and
// a few others carry only `openai`, so the name list is the second admission rule.
// KEEP IN SYNC with MODELS in scripts/build_image_arena_gallery.py.
export const IMAGE_MODELS = [
  'gpt-image-1.5', 'gpt-image-2', 'gpt-image-2-t', 'gpt-image-2.5-flare', 'gpt-image-2.5-sunburst',
  'nano-banana', 'nano-banana-2', 'nano-banana-pro',
  'doubao-seedream-4-0', 'doubao-seedream-4-5', 'doubao-seedream-5-0',
  'aigc-image-kling-3.0',
  'qwen-image-2.0', 'qwen-image-plus', 'qwen-image-max',
  'cogview-3-flash', 'cogview-4',
];
// hy-3d-* return 3D assets, mj_* use Midjourney's async proprietary API, *-edit variants need
// an input image: none of them answer a plain text-to-image request.
export const EXCLUDED_NAME_RE = /^hy-3d-|^mj_|edit/i;
// Gallery image paths are data from gallery.json; only this shape may become an <img src>.
export const IMAGE_PATH_RE = /^images\/[a-z-]+\/[a-z0-9.-]+\.(webp|png)$/;

export function normalizeBase(url) {
  return (url || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
}

export const ENDPOINT = '/v1/images/generations';

// gpt-image-* reject `response_format` (HTTP 400 "use output_format instead") and return b64
// by default; every other model needs `response_format: 'b64_json'` or answers with a URL.
export function buildImageRequest({ model, prompt, size = DEFAULT_SIZE }) {
  const body = { model, prompt, n: 1, size };
  if (/^gpt-image-/.test(model)) body.output_format = 'png';
  else body.response_format = 'b64_json';
  return body;
}

// data[0].b64_json wins; a URL is accepted only over https so it can be rendered via <img>.
export function extractImage(data) {
  const first = Array.isArray(data?.data) ? data.data[0] : null;
  if (!first || typeof first !== 'object') return null;
  if (typeof first.b64_json === 'string' && first.b64_json) return { b64: first.b64_json };
  if (typeof first.url === 'string' && /^https:\/\/\S+$/.test(first.url)) return { url: first.url };
  return null;
}

export function extractUsage(data) {
  const u = data?.usage;
  return u && typeof u === 'object' ? u : null;
}

export function isImageModel(m) {
  const name = m?.model_name;
  if (typeof name !== 'string' || !name.trim()) return false;
  if (EXCLUDED_NAME_RE.test(name)) return false;
  const types = Array.isArray(m.supported_endpoint_types) ? m.supported_endpoint_types : [];
  return types.includes('image-generation') || IMAGE_MODELS.includes(name);
}

export function filterImageModels(payload) {
  return [...new Set((payload?.data || []).filter(isImageModel).map(m => m.model_name))].sort((a, b) => a.localeCompare(b));
}

// models.json written by scripts/publish_image_arena_huggingface.py: { generated, models: [...] }.
export function filterSnapshotModels(payload) {
  return [...new Set((Array.isArray(payload?.models) ? payload.models : []).filter(m => typeof m === 'string' && m.trim() && !EXCLUDED_NAME_RE.test(m)))]
    .sort((a, b) => a.localeCompare(b));
}

// Featured models that exist in `models` first (in `featured` order), then the rest sorted.
export function groupModels(models, featured = []) {
  const set = new Set(models);
  const pinned = featured.filter(name => set.has(name));
  const pinnedSet = new Set(pinned);
  const rest = models.filter(name => !pinnedSet.has(name)).sort((a, b) => a.localeCompare(b));
  return { featured: pinned, rest };
}

// Price per image from a /api/pricing row: model_price when set, else the first t2i image
// pricing rule. Mirrors price_of() in scripts/build_image_arena_gallery.py.
export function priceOf(row) {
  if (!row || typeof row !== 'object') return null;
  if (typeof row.model_price === 'number' && row.model_price > 0) return row.model_price;
  const rules = Array.isArray(row.image_pricing?.rules) ? row.image_pricing.rules : [];
  const ordered = [...rules].sort((a, b) => (a?.capability_bucket === 't2i' ? 0 : 1) - (b?.capability_bucket === 't2i' ? 0 : 1));
  for (const r of ordered) {
    if (!r || typeof r !== 'object') continue;
    for (const k of ['platform_price_usd', 'platform_base_price', 'official_price_usd']) {
      if (k === 'platform_base_price' && r.platform_currency && r.platform_currency !== 'USD') continue;
      if (typeof r[k] === 'number' && r[k] > 0) return r[k];
    }
  }
  return null;
}

export function formatPrice(usd) {
  if (typeof usd !== 'number' || !(usd > 0)) return '';
  return '$' + (usd >= 0.01 ? usd.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : usd.toPrecision(2));
}

// Returns the path unchanged when it matches IMAGE_PATH_RE, otherwise ''.
export function safeImagePath(p) {
  return typeof p === 'string' && IMAGE_PATH_RE.test(p) ? p : '';
}

export function buildCurl(base, body) {
  return `curl ${base}${ENDPOINT} \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'`;
}

export function upstreamError(status, bodyText) {
  try {
    const j = JSON.parse(bodyText);
    const msg = j?.error?.message || j?.message || j?.error;
    if (typeof msg === 'string' && msg) return `HTTP ${status}: ${msg}`;
  } catch { /* not json */ }
  return `HTTP ${status}: ${String(bodyText || '').slice(0, 300)}`;
}

// Gallery models whose every cell succeeded, in gallery order — pinned at the top of the picker.
export function galleryFeatured(gallery) {
  const prompts = Array.isArray(gallery?.prompts) ? gallery.prompts.map(p => p?.id).filter(id => typeof id === 'string') : [];
  return (Array.isArray(gallery?.models) ? gallery.models : [])
    .filter(m => typeof m?.model === 'string' && prompts.length && prompts.every(id => m.cells?.[id]?.file && !m.cells[id].error))
    .map(m => m.model);
}
