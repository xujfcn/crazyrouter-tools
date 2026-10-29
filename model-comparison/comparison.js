(() => {
  'use strict';
  const data = JSON.parse(
    document.getElementById('comparison-data').textContent,
  );
  const { models, providers, text: t, snapshotDate, source } = data;
  const $ = (id) => document.getElementById(id);
  const selected = new Set();
  const collator = new Intl.Collator(document.documentElement.lang, {
    numeric: true,
  });
  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });
  let sortKey = 'input',
    sortDirection = 1,
    comparing = false;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char],
    );
  const priced = (model) => model.input !== null && model.output !== null;
  const price = (value) =>
    value === null
      ? `<span class="unavailable">${escape(t.unavailable)}</span>`
      : `<span class="price">$${number.format(value)}</span>`;
  const mark = (model) =>
    `<span class="provider-mark" aria-hidden="true">${escape(providers[model.provider].mark)}</span>`;
  const announce = (message) => {
    $('announcement').textContent = message;
  };

  function filtered() {
    const query = $('search').value.trim().toLocaleLowerCase();
    return models
      .filter((model) => {
        const provider = $('providerFilter').value;
        const availability = $('priceFilter').value;
        return (
          (provider === 'all' || model.provider === provider) &&
          (availability === 'all' ||
            (availability === 'available') === priced(model)) &&
          (!query ||
            `${model.name} ${model.modelId || ''} ${providers[model.provider].name}`
              .toLocaleLowerCase()
              .includes(query))
        );
      })
      .sort((a, b) => {
        const av = a[sortKey],
          bv = b[sortKey];
        // Unknown values stay last in both directions; they are never free prices.
        if (av === null && bv === null) return collator.compare(a.name, b.name);
        if (av === null) return 1;
        if (bv === null) return -1;
        const difference =
          typeof av === 'number' ? av - bv : collator.compare(av, bv);
        return difference * sortDirection || collator.compare(a.name, b.name);
      });
  }

  function renderRows() {
    const list = filtered();
    $('tbody').innerHTML = list
      .map(
        (
          model,
        ) => `<tr${selected.has(model.name) ? ' class="is-selected"' : ''}>
      <td class="select-col"><label class="selection-hit"><input type="checkbox" data-name="${escape(model.name)}" aria-label="${escape(t.select + ' ' + model.name)}" ${selected.has(model.name) ? 'checked' : ''} ${selected.size >= 4 && !selected.has(model.name) ? 'disabled' : ''}></label></td>
      <td class="model-col"><div class="model-cell">${mark(model)}<div class="model-name">${escape(model.name)}<span class="model-provider">${escape(providers[model.provider].name)}</span></div></div></td>
      <td data-price="${model.input === null ? '' : model.input}">${price(model.input)}</td>
      <td data-price="${model.output === null ? '' : model.output}">${price(model.output)}</td>
      <td>${priced(model) ? `<a class="source-link" href="${source}" target="_blank" rel="noopener noreferrer">${escape(t.priceSource)} ↗</a>` : ''}<a class="source-link secondary" href="${providers[model.provider].url}" target="_blank" rel="noopener noreferrer">${escape(t.providerDocs)} ↗</a></td>
    </tr>`,
      )
      .join('');
    $('resultsCount').textContent = t.results
      .replace('{count}', list.length)
      .replace('{total}', models.length);
    $('emptyState').hidden = list.length !== 0;
    $('tableScroll').hidden = list.length === 0;
    document.querySelectorAll('th[data-sort]').forEach((th) => {
      const active = th.dataset.sort === sortKey;
      th.setAttribute(
        'aria-sort',
        active ? (sortDirection === 1 ? 'ascending' : 'descending') : 'none',
      );
      th.querySelector('.sort-arrow').textContent = active
        ? sortDirection === 1
          ? '↑'
          : '↓'
        : '↕';
    });
  }

  function renderDock() {
    $('selectionDock').hidden = !selected.size || comparing;
    document.body.classList.toggle(
      'has-selection',
      selected.size > 0 && !comparing,
    );
    $('selectedCount').textContent = t.selected.replace(
      '{count}',
      selected.size,
    );
    $('selectionHint').textContent =
      selected.size < 2 ? t.pickAnother : t.maxFour;
    $('compareButton').disabled = selected.size < 2;
    $('compareButton').textContent = comparing ? t.backList : t.compare;
    $('compareTags').innerHTML = [...selected]
      .map(
        (name) =>
          `<span class="selected-tag">${escape(name)}<button type="button" data-remove="${escape(name)}" aria-label="${escape(t.remove + ' ' + name)}">×</button></span>`,
      )
      .join('');
  }

  function renderComparison() {
    const list = models.filter((model) => selected.has(model.name));
    const field = (label, value) =>
      `<tr><th scope="row">${escape(label)}</th>${list.map((model) => `<td>${value(model)}</td>`).join('')}</tr>`;
    $('comparisonTable').style.minWidth = `${180 + list.length * 220}px`;
    $('comparisonTable').innerHTML =
      `<caption class="sr-only">${escape(t.compareTitle)}</caption><thead><tr><th scope="col">${escape(t.metric)}</th>${list.map((model) => `<th scope="col"><div class="compare-model-top">${mark(model)}<button class="remove-model" type="button" data-remove="${escape(model.name)}" aria-label="${escape(t.remove + ' ' + model.name)}">×</button></div><span class="compare-model">${escape(model.name)}</span><span class="model-provider">${escape(providers[model.provider].name)}</span></th>`).join('')}</tr></thead><tbody>
      ${field(t.input, (model) => price(model.input))}
      ${field(t.output, (model) => price(model.output))}
      ${field(t.modelId, (model) => (model.modelId ? `<code>${escape(model.modelId)}</code>` : `<span class="unavailable">${escape(t.unavailable)}</span>`))}
      ${field(t.snapshot, (model) => (priced(model) ? snapshotDate : `<span class="unavailable">${escape(t.unavailable)}</span>`))}
      ${field(t.sources, (model) => `${priced(model) ? `<a class="source-link" href="${source}" target="_blank" rel="noopener noreferrer">${escape(t.priceSource)} ↗</a>` : ''}<a class="source-link secondary" href="${providers[model.provider].url}" target="_blank" rel="noopener noreferrer">${escape(t.providerDocs)} ↗</a>`)}
      </tbody>`;
  }

  function setView(value, focus = false) {
    comparing = value && selected.size >= 2;
    $('browseSection').hidden = comparing;
    $('compareSection').hidden = !comparing;
    if (comparing) renderComparison();
    else renderRows();
    renderDock();
    if (focus)
      (comparing ? $('compareTitle') : $('browseTitle')).focus({
        preventScroll: false,
      });
  }

  function selectionChanged() {
    if (comparing && selected.size < 2) setView(false, true);
    else {
      renderRows();
      renderDock();
      if (comparing) renderComparison();
    }
    announce(
      t.selected.replace('{count}', selected.size) +
        (selected.size === 4 ? '. ' + t.maxFour : ''),
    );
  }

  $('tbody').addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-name]');
    if (!checkbox) return;
    const name = checkbox.dataset.name;
    if (checkbox.checked && selected.size < 4) selected.add(name);
    else selected.delete(name);
    selectionChanged();
    [...$('tbody').querySelectorAll('input[data-name]')]
      .find((input) => input.dataset.name === name)
      ?.focus({ preventScroll: true });
  });
  function removeFromSelection(event) {
    const button = event.target.closest('button[data-remove]');
    if (!button) return;
    selected.delete(button.dataset.remove);
    selectionChanged();
    if (comparing) $('compareTitle').focus({ preventScroll: true });
    else if (selected.size) $('clearSelection').focus({ preventScroll: true });
    else $('browseTitle').focus({ preventScroll: true });
  }
  $('compareTags').addEventListener('click', removeFromSelection);
  $('comparisonTable').addEventListener('click', removeFromSelection);
  $('clearSelection').addEventListener('click', () => {
    selected.clear();
    setView(false, true);
    announce(t.cleared);
  });
  $('compareButton').addEventListener('click', () => setView(!comparing, true));
  $('backButton').addEventListener('click', () => setView(false, true));
  document.querySelectorAll('th[data-sort] button').forEach((button) =>
    button.addEventListener('click', () => {
      const key = button.closest('th').dataset.sort;
      sortDirection = sortKey === key ? -sortDirection : 1;
      sortKey = key;
      renderRows();
      $('tableScroll').scrollTop = 0;
    }),
  );
  function filterChanged() {
    renderRows();
    $('tableScroll').scrollTop = 0;
  }
  function resetFilters() {
    $('search').value = '';
    $('providerFilter').value = 'all';
    $('priceFilter').value = 'all';
    filterChanged();
    $('search').focus();
  }
  $('search').addEventListener('input', filterChanged);
  $('providerFilter').addEventListener('change', filterChanged);
  $('priceFilter').addEventListener('change', filterChanged);
  $('resetFilters').addEventListener('click', resetFilters);
  $('emptyReset').addEventListener('click', resetFilters);
  document.documentElement.classList.add('js-ready');
  renderRows();
})();
