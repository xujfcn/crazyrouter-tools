# Contributing

Choose a concrete improvement: a reproducible counting discrepancy, a broken link, an accessible interaction, a translation correction, or a documented model source.

For bugs, include the tool URL, browser version, expected behavior, actual behavior, and a minimal **non-sensitive** example. Never include API keys, tokens, customer prompts or billing records. Revoke any key accidentally disclosed before editing the report.

Tokenizer code lives in `projects/tokenizer-comparison/`. Run `npm ci`, `npm test` and `npm run build`. Test relative paths, mobile layout, all four languages, and the Claude legacy label. Keep public tokenizer revisions and notices intact. Avoid changing model data without native reference-token tests.

Browser-only demos live in `github/`. Do not introduce shared inference credentials or automatic paid requests. Keep DOM rendering safe for model output. Preserve upstream attribution and state the dates and limitations of recorded examples.

Describe the user-visible change and validation in your pull request. Generated tokenizer assets in `tokenizer-comparison/` must match the source build.
