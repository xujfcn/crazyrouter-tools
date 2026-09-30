---
title: Token Counter & Tokenizer Comparison
emoji: 🔎
colorFrom: green
colorTo: blue
sdk: static
app_file: index.html
pinned: false
short_description: Eight tokenizers. English, Chinese, Japanese and Korean.
tags:
  - tokenizer
  - token-counter
  - model-comparison
  - crazyrouter
---

# Token Counter & Tokenizer Comparison — by CrazyRouter

One text, eight tokenizers. Compare Qwen3-8B, DeepSeek-V3, Mistral-7B-Instruct-v0.3,
GPT `o200k_base` and `cl100k_base`, **GLM-5, Kimi K2.5 and Claude legacy**.
Inspect token pieces and IDs, and estimate input costs using your own rates.
Full **English / 简体中文 / 日本語 / 한국어** interface and Japanese/Korean examples.
The language selector preserves your text and results; `?lang=ja` and `?lang=ko`
open a specific language. Only the language preference is saved locally.

**Claude is the official legacy tokenizer (`@anthropic-ai/tokenizer` 0.0.4),
not an accurate tokenizer for Claude 3 or later (including current Sonnet, Opus
and Haiku).** Anthropic explicitly documents this limitation in its
[official repository](https://github.com/anthropics/anthropic-tokenizer-typescript).
For current Claude models, use Anthropic's `count_tokens` API. This Space does not
call that API or request your API key. The Claude row and cost estimate are legacy
reference values only.

**Free Static Space. No account, API key, GPU, backend or PRO subscription required.**
Tokenization runs in a browser Web Worker. Prompts stay on your device. Tokenizer
data and JavaScript assets are served by this Space; no inference API is called.

[Compare model pricing on CrazyRouter](https://crazyrouter.com/pricing?utm_source=huggingface&utm_medium=readme&utm_campaign=token_comparison&utm_content=readme_pricing)
· [Get an API key](https://crazyrouter.com/register?utm_source=huggingface&utm_medium=readme&utm_campaign=token_comparison&utm_content=readme_register)

## Counting method

- Pinned public tokenizer revisions are documented in `tokenizers/sources.json`.
- Uses `@huggingface/tokenizers` 0.2.0 and `js-tiktoken` 1.0.21. Full token IDs
  match Python `tokenizers` 0.23.2 and `tiktoken` 0.14.0 on 24 test inputs for each
  of the eight tokenizers, including Japanese, Korean, Unicode normalization,
  whitespace, special markers, emoji, code and long inputs. Claude is also checked
  against Anthropic's official package. This finite check is not a universal guarantee.
- Plain text only; input is passed unchanged to each tokenizer's normalization.
  No automatic special tokens, padding, truncation or chat templates are added.
- GPT rows identify encodings, not every GPT model. GLM-5 uses its native published
  tokenizer JSON. Kimi K2.5 uses its published `tiktoken.model`, with the upstream
  regex adapted to JavaScript, native special markers and 25,000-character run
  splitting preserved. The adaptation is documented in `tokenizers/sources.json`.
- Claude legacy follows the official package's NFKC normalization and embedded
  special-token handling. Gemini is not included.
- Actual API usage can include system messages, history, tools, images and provider
  processing. API usage is authoritative for billing. Fewer tokens alone does not
  imply lower cost or better quality.
- Prices are user supplied, not live CrazyRouter quotes. Blank means no estimate;
  explicit zero means zero. Input estimate excludes output, cache and other charges.
- Up to 50,000 Unicode code points; the first 200 tokens are shown in the preview.
  Counts include the entire input. Individual download failures can be retried.

## Privacy and attribution

No prompt is uploaded or saved by the app. Inputs and results live in tab memory.
Links to CrazyRouter include only UTM campaign/placement/tokenizer identifiers,
never prompt text. Hugging Face hosting access remains subject to its policies.
No tracking pixel or external analytics script is used.

Static build: Vite 6.4.1, self-hosted JavaScript and tokenizer data. This repository
contains built assets and their notices. Runtime does not require secrets.
Tokenizer data retains its upstream licenses; see `THIRD_PARTY_NOTICES.txt`.
