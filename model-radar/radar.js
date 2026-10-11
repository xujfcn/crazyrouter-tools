(() => {
  const data = window.MODEL_RADAR_DATA;
  if (!data || !Array.isArray(data.models)) document.getElementById('radarStatus').hidden = false;
  const search = document.getElementById('search');
  const provider = document.getElementById('providerFilter');
  const rows = [...document.querySelectorAll('#radarBody tr')];
  function filter() {
    let count = 0;
    for (const row of rows) {
      const matches = (!provider.value || row.dataset.provider === provider.value) &&
        `${row.dataset.name} ${row.dataset.provider}`.toLowerCase().includes(search.value.trim().toLowerCase());
      row.hidden = !matches;
      if (matches) count++;
    }
    document.getElementById('noMatches').hidden = count > 0;
  }
  search.addEventListener('input', filter); provider.addEventListener('change', filter);
})();
