# AI Model Radar / Selection Guide

This tool now serves two purposes:

1. **User-facing model selection guide** — helps visitors choose the right model for coding, chatbots, reasoning, long context, and budget-sensitive workloads.
2. **Internal market signal layer** — uses external rankings to help Crazyrouter decide what to support and feature.

## Files

- `index.html` — public tool page
- `data.js` — generated output used by the page
- `update_model_radar.py` — builds the page data bundle
- `fetch_openrouter.py` — fetches OpenRouter rankings and updates `sources/openrouter.csv`
- `sources/models.json` — curated model metadata, labels, use cases, notes
- `sources/openrouter.csv` — mapped OpenRouter ranking input
- `sources/openrouter_unmapped.csv` — fallback rows for new OpenRouter models not yet curated
- `sources/lmsys.csv` — LMSYS ranking input
- `sources/artificial.csv` — Artificial Analysis ranking input
- `sources/opencompass.csv` — OpenCompass ranking input

## Update flow

1. Refresh OpenRouter rankings:

```bash
python3 model-radar/fetch_openrouter.py
```

2. Regenerate the page data:

```bash
python3 model-radar/update_model_radar.py
```

3. Review `sources/openrouter_unmapped.csv` and optionally promote useful rows into `models.json`
4. Commit updated files

## Notes

- OpenRouter auto-refresh is working in a first usable version.
- LMSYS / Artificial Analysis / OpenCompass are still manual for now.
- Unknown OpenRouter models are no longer dropped; they fall back into the page as watchlist entries.
- The page is now user-facing first, while still retaining ranking signal value for internal strategy.
