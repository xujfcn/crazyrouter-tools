# Model comparison

The six locales share a static catalogue, styles and progressive-enhancement
script. As of October 29, 2026 the catalogue includes all **179 models** returned
by the public pricing page, across **16 providers**. The former curated list of
39 models is replaced by the current public catalogue, including text, image,
video, audio, embedding/reranking and 3D models.

Available languages are English, Spanish, Simplified Chinese, Traditional
Chinese, Japanese and Russian. Spanish lives at `/tools/es/model-comparison/`
and Traditional Chinese at `/tools/zh-TW/model-comparison/`. All pages include
the six-language switcher and reciprocal hreflang links. Spanish pricing links
use `/es/models`; Traditional Chinese uses the existing `/zh/models` pricing
page until a Traditional Chinese pricing route is available. The tools-directory
breadcrumb falls back to the English or Simplified Chinese directory as needed.

The default view sorts release dates newest first (unknowns last) and displays
the AA Intelligence Index. The metric selector also offers GPQA, MMLU-Pro and
LiveCodeBench; the index uses its original scale and individual tests use
percentages. Never mix scales or substitute one metric for another.

## Provenance and units

- `pricing-source.json` is the public pricing API response with its collection
  timestamp. Public visibility follows the pricing page rule: exclude
  suno_music and models/series containing llama (none in this snapshot).
- `catalog.json` and `pricing-snapshot.json` are generated from that response.
  Model IDs are kept verbatim, so aliases and media API products remain visible.
- Fixed token quotes use model_ratio × 2 × default group ratio × group discount,
  with completion_ratio for output. There are 80 fixed input quotes. Embeddings
  have no output quote. Tier expressions, time tiers, audio, image and video
  rates are deliberately not flattened into token prices. They retain their
  billing method and link to their filtered pricing-page entry. Plain per-request
  charges are shown only when a positive fixed charge is supplied.
- `benchmark-mapping.json` explicitly maps 83 API entries to reviewed AA model
  and creator IDs. Reference variants and reasoning effort remain visible.
  GPQA has 70 results, MMLU-Pro and LiveCodeBench have 22 each, and the
  Intelligence Index has 17. Missing results stay null.
- `release-sources.json` contains 104 dated references from AA LLM and media
  datasets. Each entry includes the source URL and source variant. Month-only
  release dates retain month precision. Existing site dates without independent
  evidence are not used. The other 75 entries show "To be verified"; these
  include aliases/products whose exact release has not been established.
  A model release date is not the data collection date or necessarily the
  first release of the broader model family. No date later than collection is
  accepted as an already released model.
- Brand marks are self-hosted in `logos/`. LobeHub icons use the included MIT
  license; TypeSafe uses the existing CrazyRouter brand asset.

## Refresh

Save a fresh public pricing response as `pricing-source.json`, adding its true
`collectedAt` timestamp. Review release references and explicit benchmark
mapping before adding scores or dates for newly listed API IDs. Keep credentials
and raw authenticated responses outside this public checkout.

```sh
python scripts/update_aa_benchmarks.py --key-file /private/path/to/key
python scripts/sync_pricing_catalog.py
python scripts/build_model_comparison.py
python scripts/seo_check.py
python scripts/test_model_comparison.py
```

The AA updater fails closed if a stable ID disappears or changes its reviewed
name/creator. All six pages link to Artificial Analysis for attribution.
API documentation: https://artificialanalysis.ai/documentation.
No browser requests to authenticated AA endpoints are made.

Browser checks verify full pricing-page set equality, source/date display,
metric units, null-last sorting, type filtering, four-model comparison,
all logos, no-JavaScript fallback and widths from 320px to 1440px.
Tests require Playwright/Chromium; renderer and SEO checks use BeautifulSoup.
COMPARISON_TEST_OUTPUT can point to an artifact directory outside the checkout.

The retired pricing-calculator routes and main-site navigation are not changed.
