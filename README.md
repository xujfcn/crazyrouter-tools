# CrazyRouter Developer Tools

Compare tokenizers, estimate API costs, and explore text and image model outputs before integrating an API.

**[Open the tools](https://xujfcn.github.io/crazyrouter-tools/github/)** · [中文](README.zh-CN.md) · [API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=tools_hub&utm_content=docs)

| Tool | Use it for | Online | Source / guide |
| --- | --- | --- | --- |
| Tokenizer comparison | Compare 8 tokenizers, token IDs and input-cost estimates; English, Chinese, Japanese and Korean | [Compare tokens](https://xujfcn.github.io/crazyrouter-tools/tokenizer-comparison/) | [Standalone source](projects/tokenizer-comparison/) |
| API cost calculator | Estimate input/output costs for a workload; inspect dated pricing snapshots | [Calculate](https://xujfcn.github.io/crazyrouter-tools/github/pricing-calculator/) | [Guide and data](github/pricing-calculator/) |
| Model arena | Compare the same prompts across chat models; inspect recorded examples and validation rules | [Explore](https://xujfcn.github.io/crazyrouter-tools/github/model-arena/) | [Methodology](github/model-arena/README.md) |
| Image arena | Compare images from the same prompts; inspect samples before making live calls | [View gallery](https://xujfcn.github.io/crazyrouter-tools/github/image-arena/) | [Methodology](github/image-arena/README.md) |
| JEV decision playground | Try classification, probability and routing examples | [Open playground](https://xujfcn.github.io/crazyrouter-tools/github/jev-playground/) | [Guide](github/jev-playground/README.md) |

![Four-language tokenizer comparison interface](docs/images/tokenizer.png)

## Start without an API key

The tokenizer and cost calculator run without an account or API key. Model and image galleries can be browsed freely. **Live inference uses your own key and may incur API charges**; it is never triggered simply by opening a page. No shared API key is included.

Choose a tool above, run the supplied example, then replace it with your own input. For tokenization, select the model tokenizer and optionally enter your own price per million input tokens. Counts cover plain text, not complete API message envelopes or tools.

**Claude is an explicitly labeled legacy tokenizer. It does not accurately count current Claude 3+ models.** For current Claude, use the provider's token-counting API. API usage is authoritative for billing. Recorded arena samples are examples, not comprehensive benchmarks or guarantees of model quality.

## Run locally

```sh
git clone https://github.com/xujfcn/crazyrouter-tools.git
cd crazyrouter-tools
python -m http.server 8000
```

Open `http://localhost:8000/github/` for the portable GitHub demos, or `/tokenizer-comparison/` for the built tokenizer. The original root pages also support the main site's `/tools/` integration; the portable demos use relative paths.

To develop the tokenizer:

```sh
cd projects/tokenizer-comparison
npm ci
npm test
npm run dev
```

## From comparison to integration

Once you choose a model, [check current prices](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=tools_hub&utm_content=pricing), [read the API examples](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=tools_hub&utm_content=integration), or [create a CrazyRouter account](https://crazyrouter.com/register?utm_source=github&utm_medium=github_readme&utm_campaign=tools_hub&utm_content=register). Tool access remains open whether or not you use CrazyRouter.

## Accuracy, privacy and contributions

- Tokenizer prompts stay in your browser. Third-party tokenizer data, versions and notices ship with the source.
- Arena requests go to the API endpoint you select; keys remain in page memory. Review each tool's guide before making a paid call.
- Prices and recorded outputs have source dates. Check current provider pricing before purchasing.
- Outbound links use campaign parameters to distinguish GitHub README, Pages and release traffic. They do not include your prompt or API key.
- [Contributing](CONTRIBUTING.md): report reproducible bugs, suggest useful models, or improve a translation. Never include credentials or sensitive prompts.
- [Release notes](docs/releases/2026-09-30.md) · [Measurement and publishing guide](docs/github-growth.md)

Each component retains its own license and third-party notices; this repository does not relicense model vocabularies or upstream examples.

## Practical guides by search intent

- [Token 是什么？中文怎么算、1K/1M Token 与分词器对比](https://xujfcn.github.io/crazyrouter-tools/github/what-is-a-token/)
- [API 费用怎么算？GPT、Claude、DeepSeek Token 计费计算器](https://xujfcn.github.io/crazyrouter-tools/github/api-cost-calculator/)
- [GPT 满血与残血怎么测试？大模型降智排查与 API 对比](https://xujfcn.github.io/crazyrouter-tools/github/gpt-full-vs-degraded-test/)
- [生图 AI 哪个好？GPT Image、Nano Banana、Seedream 同提示词对比](https://xujfcn.github.io/crazyrouter-tools/github/ai-image-generator-comparison/)
- [JEV 是什么？JEV 1.13 在线体验、分类判断与 Agent 路由示例](https://xujfcn.github.io/crazyrouter-tools/github/jev-playground-guide/)

[Keyword and canonical map](docs/seo-keyword-map.md)
