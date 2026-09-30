# Publishing and measurement

## Distribution

- Repository README: a concise directory of tools, screenshots, usage and limitations.
- GitHub Pages: `/github/` contains portable demos; `/tokenizer-comparison/` is the browser-only tokenizer.
- Hugging Face: retain the existing Spaces. The tokenizer's `public/README.md` remains Space metadata, while the project root README is written for GitHub.
- Single tokenizer source: `projects/tokenizer-comparison/`. Build once, deploy the resulting `dist/` to Pages and, when explicitly configured, Hugging Face. Do not manually patch minified assets.

## Attribution contract

| Placement | utm_source | utm_medium | utm_campaign |
| --- | --- | --- | --- |
| Repository docs | github | github_readme | tools_hub or tool name |
| Online demo | github | github_pages | tool name |
| Release notes | github | github_release | developer_tools_launch |
| Hugging Face tokenizer | huggingface | tool | token_comparison |

`utm_content` identifies a link placement; tokenizer `utm_term` identifies the selected tokenizer. Never add prompt text, API keys, email addresses or user IDs. Merely opening a tool does not create a lead or conversion.

In the existing main-site analytics, filter landing sessions by `utm_source=github` and compare each medium/campaign. Track this funnel where existing events support it: landing → registration → first successful API request → first payment. GitHub views, clones and stars are supporting measures. These changes add tagged links; they do not create new backend conversion events or claim that conversion reporting is already configured.

## Repository settings

Suggested description: `Free AI developer tools: token counter, API cost calculator, model and image comparisons, and decision playgrounds.`

Suggested topics: `tokenizer`, `token-counter`, `llm`, `api`, `developer-tools`, `model-comparison`, `huggingface`, `tiktoken`, `ai-tools`.

Set the website field to `https://xujfcn.github.io/crazyrouter-tools/github/`. Repository settings and a native GitHub Release require an authenticated GitHub API session; SSH alone can publish commits but cannot edit those settings.

## Useful updates to share

Publish release notes only for actual changes: supported tokenizers, tested language coverage, reproducible comparisons, or documented pricing updates. Include the method, source date, limitation and live demo. Share to relevant communities only with maintainer permission and in accordance with their rules. Do not post promotional Issues or unsolicited pull requests to unrelated projects.
