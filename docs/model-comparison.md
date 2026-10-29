# Model comparison

The English, Chinese, Japanese and Russian pages share the assets under
`model-comparison/`. This is a static HTML tool with progressive enhancement,
not a live pricing service or a benchmark ranking.

The October 29, 2026 redesign preserves the October 11, 2026 snapshot: 39
catalogue entries, eight providers and 17 available input/output price pairs.
No capability claims or benchmark scores have been added. Unknown prices sort
last in both directions and are never interpreted as zero.

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

To change prices, update both JSON datasets and the actual collection date.
The renderer checks that the values agree. Do not change the collection date
merely because the layout was updated.

```sh
python scripts/build_model_comparison.py
python scripts/seo_check.py
python scripts/test_model_comparison.py
```

The renderer and SEO check require BeautifulSoup. Browser tests require
Playwright with Chromium. Set `COMPARISON_TEST_OUTPUT` to an external artifact
directory to save screenshots and the check report outside the checkout.
Tests cover sorting, filters, selection, four locales, 320–1440px layouts and
the no-JavaScript fallback. They make no model API calls.

Public Sans is self-hosted; its license is in `model-comparison/FONT-LICENSE.txt`.
Canonical URLs, language alternates, structured data and the tracking bridge
are preserved. Publishing these pages does not change the retired calculator
routes or the Cloudflare Worker.
