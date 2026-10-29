# Model comparison

The English, Chinese, Japanese and Russian pages share the assets under
`model-comparison/`. This is a static HTML tool with progressive enhancement,
with separate historical prices and sourced benchmark results.

The October 29, 2026 redesign preserves the October 11, 2026 snapshot: 39
catalogue entries, eight providers and 17 available input/output price pairs.
Artificial Analysis evaluations were added on October 29, 2026: GPQA covers
38/39 models, MMLU-Pro and LiveCodeBench each cover 34/39. The response provides
no AA Intelligence Index values for these models, so the UI uses individual
benchmarks instead of inventing a composite score. Scores are percentages
(raw fractions multiplied by 100), rounded to one decimal. Missing scores and
prices sort last in either direction and are never interpreted as zero.

Every score links to its exact AA evaluated variant. Reviewed mappings use
stable model and creator IDs. Reasoning variants are used where available,
with their reasoning settings visible in the source name; this is a reference
configuration, not a claim about CrazyRouter routing defaults. GPT-4o uses
the November 2024 variant, Mistral Large 2 uses November 2024, DeepSeek-R1
uses January 2025 while R1-0528 uses May 2025. Gemini 3 Flash and 3.1 Pro
explicitly reference Preview evaluations. Gemini 3 Deep Think has no scores.
Dates are acquisition dates, not necessarily evaluation run dates. Do not
conflate the independent benchmark acquisition date with the pricing snapshot.

Users can search by display name, provider or snapshot API model ID, filter by
provider and price availability, and compare two to four models side by side.
Selections persist across filters. Removing models or clearing the selection
keeps keyboard focus usable. The original static table remains readable when
JavaScript is disabled. Narrow layouts scroll within the table, keeping model
names visible.

## Update and verify

- `catalog.json`: model names, provider references and preserved snapshot values.
- `pricing-snapshot.json`: downloadable historical pricing source.
- `locales.json`: interface copy for all four locales.
- `comparison.css` and `comparison.js`: shared presentation and interactions.
- `benchmark-mapping.json`: reviewed model/creator IDs and exact source names.
- `benchmark-snapshot.json`: public selected results and attribution, no secrets.
- `logos/`: self-hosted OpenAI, Claude, Gemini, DeepSeek, Meta, Mistral, xAI and
  Qwen marks exported from @lobehub/icons 5.18.0; MIT license included.

To change prices, update both JSON datasets and the actual collection date.
The renderer checks that the values agree. Do not change the collection date
merely because the layout was updated.

Refresh benchmarks using `python scripts/update_aa_benchmarks.py --key-file
<private-key-file-outside-checkout>` (or `--response-file` for an existing API
response). Never commit the key, include it in HTML, or call AA from the browser.
The updater fails if reviewed model identities change; review mappings first.
The acquisition timestamp comes from the API fetch time or saved response's
modification time. Rebuild HTML after updating and review the coverage copy if
AA adds composite indices. All four locales provide attribution linking to
Artificial Analysis as required by its free API documentation:
https://artificialanalysis.ai/documentation.

```sh
python scripts/build_model_comparison.py
python scripts/seo_check.py
python scripts/test_model_comparison.py
```

The renderer and SEO check require BeautifulSoup. Browser tests require
Playwright with Chromium. Set `COMPARISON_TEST_OUTPUT` to an external artifact
directory to save screenshots and the check report outside the checkout.
Tests cover sorting, filters, selection, four locales, 320–1440px layouts and
the no-JavaScript fallback, benchmark values/source variants and loaded logos.
They make no model API calls.

Public Sans is self-hosted; its license is in `model-comparison/FONT-LICENSE.txt`.
Canonical URLs, language alternates, structured data and the tracking bridge
are preserved. Publishing these pages does not change the retired calculator
routes or the Cloudflare Worker.
