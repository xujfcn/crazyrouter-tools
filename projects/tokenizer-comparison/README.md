# Tokenizer Comparison — CrazyRouter

**[Try it online](https://xujfcn.github.io/crazyrouter-tools/tokenizer-comparison/)** · [Hugging Face Space](https://huggingface.co/spaces/xujfcn/Crazyrouter-Tokenizer-Comparison) · [All tools](../../README.md)

One input, eight tokenizers. Compare Qwen3-8B, DeepSeek-V3, Mistral-7B-Instruct-v0.3, GPT `o200k_base` and `cl100k_base`, GLM-5, Kimi K2.5 and Claude legacy. Inspect token counts, pieces and IDs. Estimate input costs with your own editable rates. English / 简体中文 / 日本語 / 한국어.

![Tokenizer interface](../../docs/images/tokenizer.png)

## Run locally

```sh
npm ci
npm test
npm run dev
```

For a production build, run `npm run build`. Host `dist/` as static files. Relative paths work under a GitHub Pages project subdirectory. No backend, inference key, paid hosting or GPU is required. Runtime code runs in a Web Worker and prompts stay in the browser. First use downloads the selected tokenizer assets.

## Reproducible example

Input: `人工智能让开发更简单。用同一个 API，连接不同的大语言模型。`

| Tokenizer | Plain-text tokens |
| --- | ---: |
| Qwen3-8B | 16 |
| DeepSeek-V3 | 16 |
| Mistral-7B-Instruct-v0.3 | 28 |
| GPT o200k_base | 18 |
| GPT cl100k_base | 28 |
| GLM-5 | 16 |
| Kimi K2.5 | 15 |
| Claude legacy | 25 |

Pinned model sources and hashes are in `public/tokenizers/sources.json`. Full token IDs are checked against native implementations on 24 inputs per tokenizer; tests include Japanese, Korean, special markers, Unicode, whitespace, code and long inputs. Claude legacy also matches the official Anthropic 0.0.4 package on the tested inputs. This is a finite validation set, not a universal accuracy guarantee.

**Claude legacy is not accurate for Claude 3 or later, including current Sonnet, Opus and Haiku.** Use the provider's `count_tokens` API for current models. No automatic chat template or protocol envelope is added here; actual billable API usage can differ. Kimi uses its published ranks with a documented JavaScript regex adaptation. Prices are user inputs, not fetched live quotes.

## Deploy to Pages and Hugging Face

This directory is a self-contained source package. The surrounding tools repository builds and verifies it in GitHub Actions; the built files are published in `/tokenizer-comparison/`. It can also be copied into a standalone repository with the supplied `deployment/pages.yml` copied to `.github/workflows/pages.yml`. Enable GitHub Pages with **GitHub Actions** as the source first.

To update the existing Space from the same source, build `dist/` and use `deployment/publish_hf.py` with a write-scoped `HF_TOKEN` in the environment. The script requires `huggingface_hub`, uses a fixed existing repository and an optimistic parent commit, and excludes credentials. `public/README.md` supplies the Static Space metadata. Tokens must never be committed.

## Take the result into your app

[Compare current model prices](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=token_comparison&utm_content=pricing) · [API docs](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=token_comparison&utm_content=docs) · [Get an API key](https://crazyrouter.com/register?utm_source=github&utm_medium=github_readme&utm_campaign=token_comparison&utm_content=register)

GitHub-hosted outbound links identify `utm_source=github`; Hugging Face links identify `huggingface`. Neither contains your input. Only the language preference is stored locally.

The CrazyRouter application code is MIT licensed. Tokenizer data and third-party packages retain their own licenses; see `public/THIRD_PARTY_NOTICES.txt` and the tokenizer directories.
