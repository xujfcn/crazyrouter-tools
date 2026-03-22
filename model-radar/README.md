# AI Model Radar

This tool tracks which AI models Crazyrouter should support and highlight.

## Files

- `index.html` — public tool page
- `data.js` — generated output used by the page
- `update_model_radar.py` — build script
- `sources/models.json` — model metadata, support status, capability score, business score
- `sources/openrouter.csv` — OpenRouter ranking input
- `sources/lmsys.csv` — LMSYS ranking input
- `sources/artificial.csv` — Artificial Analysis ranking input
- `sources/opencompass.csv` — OpenCompass ranking input

## Update flow

1. Edit ranking files in `sources/`
2. Run:

```bash
python3 model-radar/update_model_radar.py
```

3. Commit updated `data.js`

## Notes

- This version is intentionally simple and static-first.
- Later we can add raw scrapers or API fetchers, but the current setup is already usable for weekly strategy reviews.
- Priority is computed in the browser from ranking + capability + business signals.
