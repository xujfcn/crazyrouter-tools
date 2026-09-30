[Live demo](https://xujfcn.github.io/crazyrouter-tools/github/image-arena/) · [All tools](../../README.md)


# AI Image Generator Comparison: GPT Image vs Nano Banana vs Seedream vs Qwen Image (17 models, same prompts)

Every text-to-image model available through [Crazyrouter](https://crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena) — OpenAI **GPT Image** (1.5, 2, 2-t, 2.5 flare / sunburst), Google **Nano Banana** (base, 2, Pro), ByteDance **Seedream** (4.0, 4.5, 5.0), **Kling 3.0** image, Alibaba **Qwen Image** (2.0, Plus, Max) and Zhipu **CogView** (3 flash, 4) — answering the same six prompts, side by side. Below the gallery, run your own prompt against up to four of them with your own API key. English and Chinese interfaces share the same page logic.

**[Run it on Crazyrouter without an API key](https://crazyrouter.com/tools/image-arena/?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)** · **[Browse Crazyrouter models and prices](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)** · **[Create a Crazyrouter API key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)** · **[API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)** · **[Model Arena (chat probes)](https://huggingface.co/spaces/xujfcn/Crazyrouter-Model-Arena)**

## The gallery

| Tab | What it tests | Prompt |
| --- | --- | --- |
| Photoreal portrait | lighting, film look, depth of field | An elderly man holding a black umbrella on a rain-soaked city street at night, neon reflections on wet asphalt, 35mm film grain, shallow depth of field, cinematic |
| E-commerce product | clean studio product shot | A minimalist glass perfume bottle with a gold cap on a pure white background, soft studio lighting, subtle reflection, product photography |
| English text rendering | legible Latin text | A café chalkboard sign that reads "OPEN 7AM – 9PM · Fresh Bagels" in neat white chalk lettering, wooden frame, warm light |
| Chinese text rendering | legible CJK text | 一副红纸金字的春联，上面写着“福满人间”四个楷体大字，挂在木门旁，喜庆，高清 |
| Multi-subject scene | several subjects with distinct props | Three animals — a fox, a raccoon and an owl — playing poker at a round wooden table, each with a distinct expression and prop (monocle, cigar, teacup), warm lamp light, detailed |
| Anime / illustration | stylised hand-painted look | A small mountain town in a valley at dawn, thin morning mist, Studio Ghibli style illustration, soft colors, hand-painted look |

Each cell is **one** call to `POST /v1/images/generations` with `{ model, prompt, n: 1, size: "1024x1024" }` plus `response_format: "b64_json"` (or `output_format: "png"` for `gpt-image-*`, which reject `response_format`), sent by the maintainers through Crazyrouter on the date shown in the page; a single retry was allowed for HTTP 429 / 5xx / network errors and is recorded in `gallery.json` (`attempts`). Models that only return a URL (Kling, Qwen Image) were downloaded server-side. Results were converted to WebP (max 1024 px, quality 82) and are served from this Space; no cherry-picking, no reruns. A model that failed that day shows its recorded error in the grid and may well succeed tomorrow — it is a sample, not a benchmark or a quality ranking. Prices are per image from `/api/pricing` at build time and may change.

Click any image for a full-size lightbox. The gallery is data: every model name, error and prompt is inserted as text, and an image path is used only when it matches `images/<prompt>/<model>.webp`.

## Run your own prompt

1. Keep the default base URL `https://crazyrouter.com`, or type any OpenAI-compatible base URL. The model list is loaded from `{base}/api/pricing` (rows tagged `image-generation`, plus the gallery names that lack the tag) when the endpoint allows cross-origin reads; for the default endpoint a bundled `models.json` snapshot is used if the live fetch fails; other endpoints fall back to a comma-separated model input. Models that succeeded on all six gallery prompts are pinned under **Featured**.
2. Paste your own API key. The key lives only in this page's memory and is sent only to the base URL you entered; it is never written to localStorage, sessionStorage, cookies or the request preview.
3. Edit the prompt (prefilled from the selected gallery tab), pick a size (1024×1024, 1024×1536, 1536×1024) and up to four models, and generate.
4. Each card shows the status pill, latency, price per image, output tokens when the provider reports them, and the image — base64 answers are rendered from an in-memory blob URL, URL answers straight from that (expiring) URL via `<img>`.

**Bring your own key.** The Space provides no shared key or free inference. Every run sends one real, paid request per model using your own balance, and nothing is retried. Requests time out after 300 s. **CORS note:** the browser calls the endpoint directly, so the endpoint must allow cross-origin requests; Crazyrouter does for `/v1/*`. Some models reject some sizes with HTTP 400 — an upstream limit, not a model failure.

## Example request

```bash
curl https://crazyrouter.com/v1/images/generations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "model": "gpt-image-2",
  "prompt": "A minimalist glass perfume bottle with a gold cap on a pure white background, soft studio lighting, subtle reflection, product photography",
  "n": 1,
  "size": "1024x1024",
  "output_format": "png"
}'
```

For every model other than `gpt-image-*`, send `"response_format": "b64_json"` instead of `output_format`. The page reads `data[0].b64_json`, or `data[0].url` when the provider returns a link.

## Crazyrouter 图片竞技场（中文）

本 Space 把 Crazyrouter 上全部文生图模型——OpenAI **GPT Image**（1.5、2、2-t、2.5 flare / sunburst）、Google **Nano Banana**（基础版、2、Pro）、字节 **Seedream**（4.0、4.5、5.0）、**Kling 3.0** 图片、阿里 **Qwen Image**（2.0、Plus、Max）、智谱 **CogView**（3 flash、4）——用同样六道提示词生成的结果并排展示；画廊下方可以用你自己的 API Key，对最多 4 个模型跑你自己的提示词。点击页面顶部的“中文”即可切换到中文界面。

- 六道题分别考察：写实人像（光影 / 胶片感 / 景深）、电商产品图、英文文字渲染、中文文字渲染（春联“福满人间”）、多主体构图（狐狸 / 浣熊 / 猫头鹰打扑克）、吉卜力风格插画。
- 每格都是一次 `POST /v1/images/generations`，参数 `{ model, prompt, n: 1, size: "1024x1024" }` 加 `response_format: "b64_json"`（`gpt-image-*` 拒绝该参数，改用 `output_format: "png"`），只允许对 429 / 5xx / 网络错误重试一次并记录在 `gallery.json` 里。只返回图片地址的模型（Kling、Qwen Image）由服务端下载。结果转成 WebP（最长边 1024，质量 82）随 Space 发布，不挑图、不重跑。当天失败的模型在网格里显示记录的错误，明天可能就成功——这是样本，不是基准测试或质量排名。价格为构建时 `/api/pricing` 的单张价格，可能变动。

Key 只保留在页面内存中，只发送给你填写的接口地址，不写入 localStorage、sessionStorage 或 Cookie。本 Space 不提供共享 Key，每次运行按模型各发一条真实请求，用你自己的余额计费，不自动重试，300 秒超时。浏览器直接调用接口，因此接口必须允许跨域（Crazyrouter 的 `/v1/*` 已开启）。部分模型会以 HTTP 400 拒绝某些尺寸，那是上游限制而不是模型失败。以 base64 返回的图片通过内存中的 blob 地址渲染，以地址返回的图片直接按该地址显示（通常会过期）。

- [在 Crazyrouter 上无需 API Key 直接运行](https://crazyrouter.com/tools/zh/image-arena/?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)
- [Crazyrouter 模型与价格](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)
- [创建 Crazyrouter API Key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)
- [Crazyrouter API 文档](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=image_arena)

## Files

`gallery.json` (prompts, per-model price / vendor and per-cell file, latency, size, usage, error, attempts), `prompts.json`, `images/<prompt>/<model>.webp`, `models.json` (picker snapshot). This Space is maintained by Crazyrouter. No model weights are hosted here. Information checked on September 29, 2026; model availability and pricing may change.
