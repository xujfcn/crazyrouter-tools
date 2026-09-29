import * as core from './core.js';

const lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const T = {
  en: {
    queued: 'Queued', running: 'Running', ok: 'Done', fail: 'Failed', aborted: 'Aborted', timeout: s => `Timed out after ${s} s`,
    cors: 'The request never reached the server. The endpoint probably does not allow browser (CORS) requests; try Crazyrouter or a CORS-enabled proxy.',
    gateway: s => `The gateway closed the connection after ${s} s before the upstream answered. The request was aborted upstream and may still be charged; retry, or choose a faster model.`,
    noImage: 'The response carried neither b64_json nor an https URL', manual: 'Model list unavailable from this endpoint; type model names separated by commas.',
    loaded: n => `${n} image models loaded`, snapshot: d => `Model list from snapshot ${d}`.trim(), pick: 'Pick at least one model', key: 'Paste an API key first', prompt: 'Type a prompt first',
    tooMany: `Only the first ${core.MAX_MODELS} models are used`, latency: 'Latency', price: 'Price', perImage: '/ image', tokens: 'Tokens', urlNote: 'Shown from the upstream URL (expires)',
    featured: 'Featured (all 6 gallery prompts succeeded)', allModels: 'All models',
    succeeded: (n, m) => `${n} of ${m} models succeeded on this prompt`, failedCell: 'Failed', noCell: 'Not generated',
    imageAlt: (model, label) => `${model}: ${label}`, gallerySub: d => `Generated on ${d} through Crazyrouter, /v1/images/generations, 1024×1024, one shot per model per prompt, no retries beyond the one recorded in gallery.json. A sample, not a benchmark.`,
    galleryMissing: 'The gallery could not be loaded.', openImage: 'Open full size', close: 'Close',
    label: p => p.label_en, promptText: p => p.prompt,
    signedIn: (user, usd) => `Signed in as ${user} · balance $${usd}`, trialCredit: usd => `playground credit $${usd}`,
    signInPrompt: 'Sign in to run without an API key', signIn: 'Sign in', register: 'Register',
    modeAccount: 'Account', modeKey: 'API key',
    accountHint: 'Account mode sends each request through the Crazyrouter Playground with your signed-in session — no API key needed; images are billed to your balance.',
  },
  zh: {
    queued: '排队中', running: '生成中', ok: '完成', fail: '失败', aborted: '已取消', timeout: s => `${s} 秒超时`,
    cors: '请求没有到达服务器。该接口可能不允许浏览器跨域（CORS）直连，请改用 Crazyrouter 或开启 CORS 的代理。',
    gateway: s => `网关在 ${s} 秒后关闭了连接，上游尚未返回。这次请求已在上游中止，仍可能计费；请重试或换一个更快的模型。`,
    noImage: '响应里既没有 b64_json 也没有 https 图片地址', manual: '该接口拿不到模型列表，请手动输入模型名，多个用逗号分隔。',
    loaded: n => `已加载 ${n} 个图片模型`, snapshot: d => `模型列表来自快照 ${d}`.trim(), pick: '请至少选择一个模型', key: '请先填写 API Key', prompt: '请先填写提示词',
    tooMany: `只使用前 ${core.MAX_MODELS} 个模型`, latency: '耗时', price: '价格', perImage: '/ 张', tokens: 'Token', urlNote: '直接显示上游图片地址（会过期）',
    featured: '精选（6 个画廊提示词全部成功）', allModels: '全部模型',
    succeeded: (n, m) => `本题 ${m} 个模型中 ${n} 个成功`, failedCell: '失败', noCell: '未生成',
    imageAlt: (model, label) => `${model}: ${label}`, gallerySub: d => `${d} 经 Crazyrouter 实跑，/v1/images/generations，1024×1024，每个模型每题一次生成，除 gallery.json 里记录的一次重试外不再重试。这是样本，不是基准测试。`,
    galleryMissing: '画廊加载失败。', openImage: '查看原图', close: '关闭',
    label: p => p.label_zh || p.label_en, promptText: p => p.prompt_zh || p.prompt,
    signedIn: (user, usd) => `已登录：${user} · 余额 $${usd}`, trialCredit: usd => `Playground 额度 $${usd}`,
    signInPrompt: '登录后无需 API Key 即可运行', signIn: '登录', register: '注册',
    modeAccount: '账户', modeKey: 'API Key',
    accountHint: '账户模式通过 Crazyrouter Playground 用你的登录会话发送请求，无需 API Key；生成费用从账户余额扣除。',
  },
}[lang];

const $ = id => document.getElementById(id);
const DEFAULT_BASE = 'https://crazyrouter.com';
const GATEWAY_HINT_MS = 60000;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// Site build (crazyrouter.com/tools): assets live under an absolute prefix, the signed-in
// session may replace the API key, and known model names link to their model pages. The
// HuggingFace build sets none of these, so every branch below is a no-op there.
const SITE_MODE = window.ARENA_SITE_MODE === true;
const ASSET_BASE = typeof window.ARENA_ASSET_BASE === 'string' ? window.ARENA_ASSET_BASE : '';
// { "<model name>": { en: "/en/models/<vendor>/<slug>", zh: "/zh/models/<vendor>/<slug>" } } from the site's page feed.
const MODEL_PAGES = window.ARENA_MODEL_PAGES && typeof window.ARENA_MODEL_PAGES === 'object' && !Array.isArray(window.ARENA_MODEL_PAGES) ? window.ARENA_MODEL_PAGES : {};
const PG_ENDPOINT = '/pg/images/generations';

const state = { models: [], selected: new Set(), manual: false, batch: null, pricingController: null, pendingBase: '', loadedBase: '', objectUrls: [], timeoutMs: core.TIMEOUT_MS, pricingTimeoutMs: 20000, gallery: null, activePrompt: '', featured: [], prices: {}, pricingRows: {}, account: { available: false, mode: 'key', uid: '', username: '' } };
const query = new URLSearchParams(location.search);
const testMode = query.has('test');
if (testMode) {
  for (const [key, param] of [['timeoutMs', 'timeout'], ['pricingTimeoutMs', 'pricingTimeout']]) {
    const v = Number(query.get(param));
    if (v > 0) state[key] = v;
  }
}
const seconds = ms => Number((ms / 1000).toFixed(1));

function accountMode() { return state.account.mode === 'account'; }
function base() { return accountMode() ? DEFAULT_BASE : core.normalizeBase($('base-url').value) || DEFAULT_BASE; }
function size() { return core.SIZES.includes($('size').value) ? $('size').value : core.DEFAULT_SIZE; }
function promptText() { return $('prompt').value.trim(); }

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

// Model names are text; only names on the build-time ARENA_MODEL_PAGES map become a link (page of the current language),
// so nothing in gallery.json or a response can mint an anchor.
function modelPagePath(model) {
  const entry = Object.prototype.hasOwnProperty.call(MODEL_PAGES, model) ? MODEL_PAGES[model] : null;
  const href = entry && typeof entry === 'object' ? entry[lang] || entry.en : null;
  return typeof href === 'string' && /^\/[a-z0-9/._-]+$/i.test(href) ? href : null;
}

function modelHeading(model) {
  const h = el('h3');
  const href = modelPagePath(model);
  if (href) { const a = el('a', 'model-link', model); a.href = href; h.append(a); }
  else h.textContent = model;
  return h;
}

// ---------- Gallery (data only: every string via textContent, every path via safeImagePath) ----------
// The whole gallery is rendered once: one tab and one hidden panel per prompt; showPrompt()
// only toggles visibility. A prerendered page (site build, data-prerendered on #gallery) already
// carries that markup, so the runtime just wires the existing tabs and thumbnails to their
// handlers and still reads gallery.json for the picker's featured group and prices.

async function loadGallery() {
  const prerendered = Boolean($('gallery').dataset.prerendered);
  if (prerendered) wireGallery();
  let data;
  try {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(8000) : undefined;
    const res = await fetch(ASSET_BASE + 'gallery.json', { signal, cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch { if (!prerendered) $('gallery-sub').textContent = T.galleryMissing; return; }
  if (prerendered) { if (adoptGallery(data)) { if (state.models.length) renderModelList(); } return; }
  if (!renderGallery(data)) $('gallery-sub').textContent = T.galleryMissing;
}

function adoptGallery(data) {
  const prompts = (Array.isArray(data?.prompts) ? data.prompts : []).filter(p => typeof p?.id === 'string' && /^[a-z-]+$/.test(p.id) && typeof p.prompt === 'string');
  const models = (Array.isArray(data?.models) ? data.models : []).filter(m => typeof m?.model === 'string' && m.model.trim());
  if (!prompts.length || !models.length) return false;
  state.gallery = { prompts, models, generated: typeof data.generated === 'string' ? data.generated.slice(0, 10) : '' };
  state.featured = core.galleryFeatured(state.gallery);
  for (const m of models) if (typeof m.price_usd === 'number') state.prices[m.model] = m.price_usd;
  return true;
}

// Builds tabs and panels from gallery.json; also the static-build entry (window.__arena.renderStatic).
function renderGallery(data) {
  if (!adoptGallery(data)) return false;
  const g = state.gallery;
  $('gallery-sub').textContent = T.gallerySub(g.generated);
  const tabs = $('prompt-tabs');
  const panels = $('gallery-panels');
  tabs.replaceChildren();
  panels.replaceChildren();
  for (const p of g.prompts) {
    const b = el('button', 'prompt-tab', T.label(p));
    b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tab-' + p.id; b.dataset.prompt = p.id;
    b.setAttribute('aria-controls', 'panel-' + p.id);
    tabs.append(b);
    const panel = el('div', 'gallery-panel');
    panel.id = 'panel-' + p.id; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', b.id); panel.dataset.prompt = p.id; panel.hidden = true;
    const box = el('div', 'prompt-box');
    const alt = typeof p.prompt_zh === 'string' && p.prompt_zh !== p.prompt ? p.prompt_zh : '';
    const promptAlt = el('p', 'prompt-text prompt-alt prompt-zh', alt); promptAlt.hidden = !alt;
    const count = el('p', 'meta gallery-count');
    box.append(el('p', 'prompt-text prompt-en', p.prompt), promptAlt, count);
    const grid = el('div', 'gallery-grid');
    let ok = 0;
    for (const m of g.models) {
      const cell = m.cells && typeof m.cells === 'object' ? m.cells[p.id] : null;
      const card = el('article', 'gallery-card');
      const file = cell && !cell.error ? core.safeImagePath(cell.file) : '';
      if (file) {
        ok++;
        const btn = el('button', 'gallery-thumb');
        btn.type = 'button';
        btn.setAttribute('aria-label', T.openImage + ': ' + m.model);
        btn.dataset.model = m.model; btn.dataset.label = T.label(p);
        const img = el('img');
        img.loading = 'lazy'; img.decoding = 'async'; img.src = ASSET_BASE + file; img.alt = T.imageAlt(m.model, T.label(p));
        if (Number.isFinite(cell.width) && Number.isFinite(cell.height) && cell.width > 0) { img.width = cell.width; img.height = cell.height; }
        btn.append(img);
        card.append(btn);
      } else {
        const box = el('div', 'gallery-thumb failed');
        box.append(el('span', 'pill fail', T.failedCell), el('p', null, typeof cell?.error === 'string' && cell.error ? cell.error : T.noCell));
        card.append(box);
      }
      const meta = el('div', 'gallery-meta');
      meta.append(modelHeading(m.model));
      const line = el('div', 'meta-row');
      if (typeof m.vendor === 'string' && m.vendor) line.append(el('span', 'meta', m.vendor));
      const price = core.formatPrice(m.price_usd);
      if (price) line.append(el('span', 'meta', price + ' ' + T.perImage));
      if (file && Number.isFinite(cell.latency_ms)) line.append(el('span', 'meta', `${T.latency}: ${(cell.latency_ms / 1000).toFixed(1)} s`));
      meta.append(line);
      card.append(meta);
      grid.append(card);
    }
    count.textContent = T.succeeded(ok, g.models.length);
    panel.append(box, grid);
    panels.append(panel);
  }
  wireGallery();
  if (state.models.length) renderModelList();
  return true;
}

// Attaches tab and lightbox handlers to whatever gallery markup is in the page (freshly
// rendered or prerendered) and activates the first tab.
function wireGallery() {
  const tabs = [...$('prompt-tabs').querySelectorAll('[role=tab]')];
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => showPrompt(b.dataset.prompt));
    b.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      showPrompt(next.dataset.prompt); next.focus(); e.preventDefault();
    });
  });
  for (const btn of $('gallery-panels').querySelectorAll('button.gallery-thumb')) {
    btn.addEventListener('click', () => { const img = btn.querySelector('img'); if (img) openLightbox(img.getAttribute('src'), btn.dataset.model || '', btn.dataset.label || ''); });
  }
  if (tabs.length) showPrompt(tabs[0].dataset.prompt);
}

function showPrompt(id) {
  const panel = $('panel-' + id);
  if (!panel) return;
  state.activePrompt = id;
  for (const b of $('prompt-tabs').querySelectorAll('[role=tab]')) {
    const active = b.dataset.prompt === id;
    b.setAttribute('aria-selected', String(active));
    b.tabIndex = active ? 0 : -1;
    b.classList.toggle('active', active);
  }
  for (const p of $('gallery-panels').querySelectorAll('[role=tabpanel]')) p.hidden = p !== panel;
  if (!$('prompt').dataset.touched) { $('prompt').value = panel.querySelector('.prompt-en')?.textContent || ''; updatePreview(); }
}

function openLightbox(src, model, label) {
  const dlg = $('lightbox');
  const img = $('lightbox-img');
  img.src = src; img.alt = T.imageAlt(model, label);
  $('lightbox-title').textContent = model;
  $('lightbox-label').textContent = label;
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

// ---------- Live section ----------

async function loadModels() {
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
    state.models = core.filterImageModels(payload);
    if (!state.models.length) throw new Error('empty');
    state.pricingRows = {};
    for (const row of payload.data || []) if (row && typeof row.model_name === 'string') { const pr = core.priceOf(row); if (pr) state.prices[row.model_name] = pr; }
    state.manual = false;
    state.loadedBase = target;
    state.selected.clear();
    renderModelList();
    $('model-status').textContent = T.loaded(state.models.length);
    notice('');
  } catch {
    if (state.pricingController !== controller) return;
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
  const { featured, rest } = core.groupModels(state.models, state.featured);
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
    const price = core.formatPrice(state.prices[name]);
    if (price) label.append(el('span', 'model-price', price));
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
  const body = core.buildImageRequest({ model: models[0] || 'MODEL', prompt: promptText() || 'PROMPT', size: size() });
  $('request-code').textContent = core.buildCurl(base(), body);
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
  return { url: base() + core.ENDPOINT, credentials: 'same-origin', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } };
}

async function runOne(model, token, batchSignal, card) {
  setStatus(card, 'running');
  const { url: endpoint, credentials, headers } = requestInit(token);
  const body = core.buildImageRequest({ model, prompt: promptText(), size: size() });
  const timeoutMs = state.timeoutMs;
  const { signal, cleanup } = makeSignal(batchSignal, timeoutMs);
  const started = performance.now();
  let res, text;
  try {
    res = await fetch(endpoint, { method: 'POST', signal, credentials, headers, body: JSON.stringify(body) });
    text = await res.text();
  } catch (err) {
    const elapsed = performance.now() - started;
    card.latency.textContent = `${T.latency}: ${seconds(elapsed)} s`;
    if (batchSignal.aborted) showError(card, T.aborted, 'aborted');
    else if (signal.aborted || err?.name === 'TimeoutError') showError(card, T.timeout(seconds(timeoutMs)), 'fail');
    else if (err instanceof TypeError && res === undefined) showError(card, elapsed >= GATEWAY_HINT_MS ? T.gateway(Math.round(elapsed / 1000)) : T.cors, 'fail');
    else showError(card, err?.message || String(err), 'fail');
    return;
  } finally { cleanup(); }
  const latencyMs = performance.now() - started;
  card.latency.textContent = `${T.latency}: ${seconds(latencyMs)} s`;
  if (!res.ok) return showError(card, core.upstreamError(res.status, text), 'fail');
  let data;
  try { data = JSON.parse(text); } catch { return showError(card, core.upstreamError(res.status, text), 'fail'); }
  const usage = core.extractUsage(data);
  if (usage) {
    const out = usage.output_tokens ?? usage.total_tokens;
    if (Number.isFinite(out)) card.tokens.textContent = `${T.tokens}: ${out}`;
  }
  const image = core.extractImage(data);
  if (!image) return showError(card, data?.error?.message ? core.upstreamError(res.status, text) : T.noImage, 'fail');
  const img = el('img', 'live-image');
  img.alt = model;
  if (image.b64) {
    let bytes;
    try { const bin = atob(image.b64); bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); } catch { return showError(card, T.noImage, 'fail'); }
    img.src = URL.createObjectURL(new Blob([bytes]));
    state.objectUrls.push(img.src);
  } else {
    img.src = image.url;
    img.referrerPolicy = 'no-referrer';
    card.note.textContent = T.urlNote;
  }
  card.preview.replaceChildren(img);
  setStatus(card, 'ok');
}

function setStatus(card, s) { card.status.textContent = T[s]; card.status.className = 'pill ' + s; }
function showError(card, message, s) { card.error.textContent = message; card.error.hidden = false; setStatus(card, s); }

function buildCard(model) {
  const card = el('article', 'model-card');
  const head = el('div', 'probe-head');
  const status = el('span', 'pill queued', T.queued);
  head.append(modelHeading(model), status);
  const latency = el('span', 'meta'), tokens = el('span', 'meta'), priceEl = el('span', 'meta');
  const price = core.formatPrice(state.prices[model]);
  if (price) priceEl.textContent = `${T.price}: ${price} ${T.perImage}`;
  const meta = el('div', 'meta-row'); meta.append(latency, priceEl, tokens);
  const preview = el('div', 'preview');
  const note = el('p', 'hint');
  const error = el('div', 'error'); error.hidden = true;
  card.append(head, meta, preview, note, error);
  $('results').append(card);
  return { card, status, latency, tokens, preview, note, error };
}

async function run() {
  const token = $('token').value.trim();
  const all = selectedModels();
  const models = all.slice(0, core.MAX_MODELS);
  if (!token && !accountMode()) return notice(T.key, true);
  if (!promptText()) return notice(T.prompt, true);
  if (!models.length) return notice(T.pick, true);
  notice(all.length > core.MAX_MODELS ? T.tooMany : '');
  updatePreview();
  for (const u of state.objectUrls) URL.revokeObjectURL(u);
  state.objectUrls = [];
  $('results').replaceChildren();
  $('empty').hidden = true;
  const controller = new AbortController();
  state.batch = controller;
  $('run').disabled = true; $('cancel').disabled = false;
  try {
    await Promise.allSettled(models.map(model => runOne(model, token, controller.signal, buildCard(model))));
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
  for (const input of document.querySelectorAll('#mode-toggle input')) input.checked = input.value === mode;
  $('account-hint').hidden = !account;
  state.loadedBase = '';
  state.selected.clear();
  loadModels();
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
  const login = el('a', 'account-link', T.signIn); login.href = '/login';
  const register = el('a', 'account-link', T.register); register.href = '/register';
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
$('prompt').addEventListener('input', () => { $('prompt').dataset.touched = '1'; updatePreview(); });
for (const id of ['size', 'model-manual']) $(id).addEventListener('input', updatePreview);
$('copy').addEventListener('click', () => navigator.clipboard?.writeText($('request-code').textContent));
$('lightbox-close').addEventListener('click', () => $('lightbox').close());
$('lightbox').addEventListener('click', e => { if (e.target === $('lightbox')) $('lightbox').close(); });
$('lightbox').addEventListener('close', () => { $('lightbox-img').removeAttribute('src'); });
$('cancel').disabled = true;
loadGallery();
if (SITE_MODE) initAccount().then(() => { if (!state.account.available) loadModels(); });
else loadModels();
updatePreview();

if (testMode) window.__arena = { core, state, showPrompt, renderStatic: renderGallery };
