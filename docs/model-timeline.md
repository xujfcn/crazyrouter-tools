# Model release timeline

The timeline is a curated history through **2026-10-29**, with **198 records**
across **15 providers**. English, Spanish, Simplified Chinese, Traditional
Chinese, Japanese and Russian share one release dataset, renderer, stylesheet
and browser script. Each generated page contains the complete static list.

## Evidence and scope

- `model-timeline/releases.json` records the review date, actual AA collection
  timestamp, provider, exact reference variant, date precision and source URL.
  It contains dates and identities, not benchmark scores or price claims.
- 47 records cite provider announcements, official changelogs or the original
  GPT-3 paper. Other dates are explicitly labelled Artificial Analysis records.
  Never describe the AA date as an independently verified provider announcement.
- Dated public pricing models are included, with additional historical and
  recent releases from the 12 core language-model providers. This is not a
  complete industry catalogue. An entry does not imply current API availability.
- AA reasoning-effort settings are consolidated. Separate snapshots, previews,
  API launches, general availability and weight releases retain their context.
  For example Gemini 4 Argon has an AA record dated September 30 and an official
  API general-availability milestone dated October 13.
- Official corrections include Claude 3 Haiku (March 13, 2024), Llama 4 Scout
  and Maverick (April 5, 2025), Grok 4 (July 9, 2025), Claude Sonnet 4.5
  (September 29, 2025), and DeepSeek V3-0324 (March 24, 2025).
  Kimi K3.1 Pro retains AA's October 23 date and links the provider's October 24
  publication separately. Mistral Large 4's October 29 date is attributed to
  AA, with the provider's weights-release announcement as supporting context.
- Media dates carried over from the reviewed comparison dataset retain their
  source precision. Some now have exact dates from provider changelogs. A
  month-only date remains a month, including in sorting and chart labels.
- Unsupported legacy entries (including DeepSeek V3.5 and the 2026 R1-0120
  date), invented parameter counts, and tool launches presented as model
  releases are removed. GPT-3 is represented by its May 28, 2020 paper.

Primary sources reviewed include OpenAI's API changelog, Google's Gemini API
release notes, DeepSeek's changelog, Anthropic model announcements, Meta's
Llama 4 announcement, Qwen release blogs and Mistral release announcements.
Each record links its own source. Full fetched source pages and authenticated
responses stay outside this public repository.

## Refresh

Fetch the AA endpoint with a private server-side API key and store its response
outside this checkout. Record the actual collection time; do not substitute a
build timestamp. Review model mappings and official milestones in the sync
script before updating the cutoff.

```sh
python scripts/sync_model_timeline.py --aa-file /private/aa-response.json --collected-at 2026-10-29T14:12:29Z --as-of 2026-10-29
python scripts/build_model_timeline.py
python scripts/seo_check.py
python scripts/test_model_timeline.py
```

The renderer updates only timeline routes in the formal sitemap. Browser assets
use a version query; bump `VERSION` when changing CSS/JS after publication.
No browser request uses an API key. Comparison pages and their data are separate.

## Interaction and verification

The default view is the provider timeline, showing the current month and two
preceding calendar months. The release list is available through the view switch
and sorts newest first. Search, provider, type, period and date-source filters combine.
URL parameters preserve the selection across reloads and language changes.
Mobile secondary filters are expandable; release sources remain visible.

The chart uses collision-free lanes, real date positions, zoom and fit. A
dashed span represents a month-only date. Each event is a keyboard button
opening a native dialog; Escape closes it and restores focus. Empty results,
reduced motion and a complete no-JavaScript list are supported.

Browser checks cover all six locales at 320/390/768/1440px; filter set equality,
date ordering, sources, logos, URL persistence, mobile filters, collision-free
chart placement, zoom/fit, keyboard dialog behavior and the static fallback.
Set `TIMELINE_TEST_OUTPUT` to an external artifact directory; set
`TIMELINE_BASE_URL` to validate a deployed `/tools` base.
