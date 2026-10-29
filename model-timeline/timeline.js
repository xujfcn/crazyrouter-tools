(() => {
  'use strict';
  const dataElement = document.getElementById('timeline-data');
  if (!dataElement) return;
  const data = JSON.parse(dataElement.textContent);
  const t = data.text;
  const $ = (id) => document.getElementById(id);
  const rows = new Map(Array.from(document.querySelectorAll('.release-row'), row => [row.dataset.id, row]));
  if (rows.size !== data.events.length) return; // Preserve the complete static fallback.
  const byId = new Map(data.events.map(event => [event.id, event]));
  const filters = ['search', 'provider', 'category', 'period', 'source', 'sort'];
  const defaults = {search: '', provider: 'all', category: 'all', period: 'recent', source: 'all', sort: 'newest', view: 'list'};
  let state = {...defaults};
  let visible = [];
  let zoom = 1;
  const DAY = 86400000;
  const stamp = (date) => Date.parse((date.length === 7 ? date + '-01' : date) + 'T00:00:00Z');
  const cutoff = stamp(data.asOf);
  const normal = (str) => str.normalize('NFKC').toLocaleLowerCase().trim();
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const monthLabel = (key) => {
    const [year, month] = key.split('-');
    const label = t.monthNames[Number(month) - 1];
    return /^(zh|ja)/.test(document.documentElement.lang) ? `${year}年${label}` : `${label} ${year}`;
  };
  const monthEnd = (date) => {
    const [year, month] = date.split('-').map(Number);
    return Math.min(cutoff, Date.UTC(year, month, 0));
  };
  const range = () => {
    const [year, month] = data.asOf.split('-').map(Number);
    if (state.period === 'recent') return [Date.UTC(year, month - 3, 1), cutoff];
    if (state.period === 'month') return [Date.UTC(year, month - 1, 1), cutoff];
    if (state.period === 'year') return [Date.UTC(year, 0, 1), cutoff];
    if (/^\d{4}$/.test(state.period)) return [Date.UTC(Number(state.period), 0, 1), Math.min(Date.UTC(Number(state.period), 11, 31), cutoff)];
    return [Math.min(...data.events.map(event => stamp(event.date))), cutoff];
  };
  function readURL() {
    const params = new URLSearchParams(location.search);
    state = {...defaults};
    for (const key of filters) {
      const value = params.get(key);
      if (value !== null && (key === 'search' || Array.from($(key).options).some(option => option.value === value))) state[key] = value;
      $(key).value = state[key];
    }
    if (params.get('view') === 'timeline') state.view = 'timeline';
  }
  function writeURL() {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(state)) {
      if (value === defaults[key]) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    history.replaceState(null, '', url);
    for (const a of document.querySelectorAll('.languages a')) {
      const target = new URL(a.href);
      target.search = url.search;
      a.href = target.pathname + target.search;
    }
  }
  function filteredEvents() {
    const query = normal(state.search);
    const [start, end] = range();
    return data.events.filter(event => {
      const from = stamp(event.date);
      const through = event.precision === 'month' ? monthEnd(event.date) : from;
      const text = `${event.name} ${event.aliases.join(' ')} ${data.providers[event.provider].name} ${event.source.variant || ''}`;
      return (!query || normal(text).includes(query)) &&
        (state.provider === 'all' || state.provider === event.provider) &&
        (state.category === 'all' || state.category === event.category) &&
        (state.source === 'all' || state.source === event.source.kind) && through >= start && from <= end;
    }).sort((a, b) => {
      const result = a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
      return state.sort === 'newest' ? -result : result;
    });
  }
  function renderList() {
    const groups = new Map();
    for (const event of visible) {
      const key = event.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    }
    const fragment = document.createDocumentFragment();
    for (const [month, events] of groups) {
      const group = el('section', 'month-group');
      group.dataset.month = month;
      group.setAttribute('aria-labelledby', `month-${month}`);
      const heading = el('div', 'month-heading');
      const title = el('h2', '', monthLabel(month));
      title.id = `month-${month}`;
      heading.append(title, el('span', 'month-count', events.length));
      const records = el('div', 'month-records');
      for (const event of events) records.append(rows.get(event.id));
      group.append(heading, records);
      fragment.append(group);
    }
    $('releaseList').replaceChildren(fragment);
  }
  function openDetail(id) {
    const event = byId.get(id);
    const original = rows.get(id);
    if (!event || !original) return;
    const title = el('h2', '', event.name);
    title.id = 'detailTitle';
    const body = $('detailBody');
    body.replaceChildren(title, original.querySelector('.release-meta').cloneNode(true), original.querySelector('.release-date').cloneNode(true), original.querySelector('.release-source').cloneNode(true));
    const details = original.querySelector('.record-details').cloneNode(true);
    details.open = true;
    body.append(details);
    $('releaseDialog').showModal();
  }
  function renderChart() {
    if (state.view !== 'timeline' || !visible.length) return;
    const container = $('chartScroll');
    const chart = $('chart');
    const labelWidth = window.matchMedia('(max-width:760px)').matches ? 104 : 148;
    const available = Math.max(120, container.clientWidth - labelWidth);
    const width = Math.round(available * zoom);
    // Leave room after the last dated anchor so every model label stays inside.
    const cardWidth = Math.min(194, Math.max(100, width * .48));
    const plotWidth = Math.max(20, width - cardWidth - 18);
    const [start, end] = range();
    const days = Math.max(1, (end - start) / DAY);
    const x = (ms) => 8 + Math.max(0, Math.min(1, (ms - start) / (days * DAY))) * plotWidth;
    chart.style.width = `${labelWidth + width}px`;
    const ticks = [];
    const monthCount = days / 30.44;
    const step = monthCount > 30 ? 12 : monthCount > 10 ? 3 : 1;
    let cursor = new Date(start);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    while (cursor.getTime() <= end) {
      if (cursor.getTime() >= start) {
        const key = cursor.toISOString().slice(0, 7);
        ticks.push({left: x(cursor.getTime()), label: step === 12 ? key.slice(0, 4) : key});
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + step);
    }
    if (!ticks.length) ticks.push({left: 8, label: new Date(start).toISOString().slice(0, 10)});
    // Drop ticks that would collide at narrow widths, keeping their true positions.
    const readableTicks = ticks.filter((tick, index) => index === 0 || tick.left - ticks[index - 1].left >= 68);
    const fragment = document.createDocumentFragment();
    const axis = el('div', 'chart-axis');
    axis.append(el('div', 'axis-label', t.provider));
    const axisTrack = el('div', 'axis-track');
    for (const tick of readableTicks) {
      const node = el('span', 'axis-tick', tick.label);
      node.style.left = `${tick.left}px`;
      axisTrack.append(node);
    }
    axis.append(axisTrack);
    fragment.append(axis);
    const providerIds = Array.from(new Set(visible.map(e => e.provider))).sort((a, b) => data.providers[a].name.localeCompare(data.providers[b].name));
    for (const providerId of providerIds) {
      const provider = data.providers[providerId];
      const row = el('div', 'chart-row');
      const label = el('div', 'chart-provider');
      const img = el('img');
      img.src = data.assets + provider.logo; img.alt = ''; img.width = 22; img.height = 22;
      label.append(img, el('span', '', provider.name));
      const track = el('div', 'chart-track');
      for (const tick of readableTicks) {
        const line = el('span', 'grid-line');
        line.style.left = `${tick.left}px`;
        line.setAttribute('aria-hidden', 'true');
        track.append(line);
      }
      const lanes = [];
      const events = visible.filter(e => e.provider === providerId).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
      for (const event of events) {
        const left = x(stamp(event.date));
        const spanEnd = event.precision === 'month' ? x(monthEnd(event.date)) : left;
        const right = Math.max(left + cardWidth, spanEnd);
        let lane = lanes.findIndex(lastRight => lastRight + 10 < left);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = right;
        const top = 12 + lane * 60;
        if (event.precision === 'month') {
          const span = el('span', 'month-span');
          span.style.cssText = `left:${left}px;top:${top + 51}px;width:${Math.max(2,spanEnd-left)}px`;
          span.setAttribute('aria-hidden','true');
          track.append(span);
        }
        const button = el('button', `chart-event${event.precision === 'month' ? ' month-event' : ''}`);
        button.type = 'button'; button.dataset.id = event.id;
        button.style.cssText = `left:${left}px;top:${top}px;width:${cardWidth}px`;
        const date = el('time', '', `${event.date} · ${t[event.stage]}`); date.dateTime = event.date;
        button.append(el('strong', '', event.name), date);
        button.title = `${event.name} · ${event.date} · ${t[event.stage]}`;
        button.setAttribute('aria-label', `${event.name}, ${event.date}, ${t[event.stage]}, ${t.details}`);
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => openDetail(event.id));
        track.append(button);
      }
      track.style.height = `${Math.max(76, lanes.length * 60 + 20)}px`;
      row.append(label, track); fragment.append(row);
    }
    chart.replaceChildren(fragment);
    $('zoomLabel').textContent = `${Math.round(zoom * 100)}%`;
    $('zoomOut').disabled = zoom <= 1;
    $('zoomIn').disabled = zoom >= 4;
  }
  function render() {
    visible = filteredEvents();
    const timeline = state.view === 'timeline';
    $('listView').setAttribute('aria-pressed', String(!timeline));
    $('timelineView').setAttribute('aria-pressed', String(timeline));
    $('releaseList').hidden = timeline || !visible.length;
    $('timelinePanel').hidden = !timeline || !visible.length;
    $('emptyState').hidden = !!visible.length;
    $('sort').disabled = timeline;
    $('resultCount').textContent = t.results.replace('{count}', visible.length).replace('{total}', data.events.length);
    const activeFilters = ['provider','category','source'].filter(key => state[key] !== 'all').length;
    $('filterToggle').textContent = ($('filterToggle').getAttribute('aria-expanded') === 'true' ? t.lessFilters : t.moreFilters) + (activeFilters ? ` (${activeFilters})` : '');
    renderList(); renderChart(); writeURL();
  }
  function reset() {
    state = {...defaults}; zoom = 1;
    for (const key of filters) $(key).value = state[key];
    render();
  }
  for (const key of filters) {
    $(key).addEventListener(key === 'search' ? 'input' : 'change', () => { state[key] = $(key).value; render(); });
  }
  $('reset').addEventListener('click', reset);
  $('filterToggle').addEventListener('click', () => {
    const expanded = $('filterToggle').getAttribute('aria-expanded') !== 'true';
    $('filterToggle').setAttribute('aria-expanded', String(expanded));
    $('filters').classList.toggle('filters-expanded', expanded);
    render();
  });
  $('emptyReset').addEventListener('click', () => { reset(); $('search').focus(); });
  $('listView').addEventListener('click', () => { state.view = 'list'; render(); });
  $('timelineView').addEventListener('click', () => { state.view = 'timeline'; render(); });
  for (const [id, delta] of [['zoomIn', .5], ['zoomOut', -.5], ['fit', 0]]) {
    $(id).addEventListener('click', () => {
      zoom = delta ? Math.min(4, Math.max(1, zoom + delta)) : 1;
      renderChart();
      if (!delta) $('chartScroll').scrollLeft = 0;
    });
  }
  $('closeDialog').addEventListener('click', () => $('releaseDialog').close());
  $('releaseDialog').addEventListener('click', event => {
    const r = $('releaseDialog').getBoundingClientRect();
    if (event.target === $('releaseDialog') && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) $('releaseDialog').close();
  });
  let resizeFrame;
  window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(renderChart); });
  window.addEventListener('popstate', () => { readURL(); render(); });
  readURL();
  document.documentElement.classList.add('enhanced');
  render();
})();
