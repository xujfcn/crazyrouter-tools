[Live demo](https://xujfcn.github.io/crazyrouter-tools/github/model-arena/) · [All tools](../../README.md)


# LLM Degradation Test & Model Comparison: GPT-6 vs Claude vs DeepSeek vs Kimi (Pelican SVG + Candy Puzzle)

Run the two probes made popular by [manxue-ai](https://github.com/w1196396546/manxue-ai) — an animated **pelican riding a bicycle** SVG and the **candy pigeonhole puzzle** — against up to four models at once through any OpenAI-compatible endpoint, with your own API key, and compare the answers side by side in the browser. English and Chinese interfaces share the same page logic.

**[Run it on Crazyrouter without an API key](https://crazyrouter.com/tools/model-arena/?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)** · **[Browse Crazyrouter models and prices](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)** · **[Create a Crazyrouter API key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)** · **[API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)**

## The two probes

| Probe | Prompt | Pass rule |
| --- | --- | --- |
| Pelican SVG | A fixed Chinese prompt asking for a standalone looping 2D SVG animation of a pelican on a bicycle, with a randomly drawn scene and a 6-character nonce that must appear in a visible `<text>` element | The reply contains one complete `<svg>` that parses as XML, has no scripts, event handlers, external references or foreign objects, declares an animation (SMIL or CSS `@keyframes`), and shows the nonce in a `<text>` element. All three flags must be true. |
| Candy puzzle | A fixed Chinese pigeonhole question about three flavours and two shapes of candy | The answer contains the standalone number `21` (so `121`, `21.5` and `x21` do not count). It is a string match, not a semantic grade. |

The scene and nonce are drawn once per run and shared by every model in the batch so the comparison is fair. Prompts and rules are copied verbatim from manxue-ai so results stay comparable with manxue.ai. Neither probe proves model identity or overall capability.

## How to use

1. Keep the default base URL `https://crazyrouter.com`, or type any OpenAI-compatible base URL. The model list is loaded from `{base}/api/pricing` when the endpoint allows cross-origin reads; for the default Crazyrouter endpoint a bundled `models.json` snapshot (rewritten by the publisher on every dry run and publish, date shown next to the list) is used if the live fetch fails; other endpoints fall back to a comma-separated model input.
2. Paste your own API key. The key lives only in this page's memory and is sent only to the base URL you entered; it is never written to localStorage, sessionStorage, cookies or the request preview.
3. Tick up to four models and either or both probes, choose Chat Completions or Responses, optionally set a reasoning effort, and run.
4. Each card shows the status pill, latency, token usage, the rendered SVG (as an image, so no script can run), the three check badges, and collapsible full answer and SVG source.

**Bring your own key.** The Space provides no shared key or free inference. Every run sends one real, paid request per model per probe using your own balance, and nothing is retried. **CORS note:** the browser calls the endpoint directly, so the endpoint must allow cross-origin requests; Crazyrouter does for `/v1/*`. Requests are streamed (`stream: true`) and assembled in the page, which keeps the connection alive through edge gateways that would otherwise close a long non-streaming generation after 100–120 s; a request that runs longer than 300 s in total still times out. If the upstream sends no first byte before the gateway gives up (typical when a model reasons for a long time before emitting), the page says so — the request was aborted upstream and may still be charged; retry or pick a faster model. The output cap is selectable (8000 / 16000 / 32000 / 64000). The default is 32000 rather than manxue's 16000 because Claude 5 models count their hidden adaptive reasoning against the cap (measured 7k–16k thinking tokens on the pelican prompt, via both `/v1/chat/completions` and `/v1/messages`), which truncates every Claude SVG at 16000; pick 16000 for manxue-comparable runs. Some models reject a high cap with HTTP 400 — an upstream limit, not a model failure.

## Showcase and featured models

Below the arena, a **Showcase** section shows real answers from one run of seven frontier models — `gpt-6-astra`, `gpt-5`, `claude-opus-5-5`, `claude-fable-5-1`, `deepseek-v4-pro`, `kimi-k3` and `glm-5.3` — recorded by the maintainers through Crazyrouter on 2026-09-28 (UTC) with the same prompts, the same scene and nonce for every model, Chat Completions, reasoning effort omitted. Probes that failed on the first day were re-run on 2026-09-29 with the same scene and nonce (every attempt is counted in `samples.json`); those re-runs used the 32000-token cap (see above) and, for `kimi-k3` and `glm-5.3`, a 900 s budget because they reason for many minutes before emitting an answer, whereas the live arena keeps the 300 s limit; each probe's cap and timeout are recorded in `samples.json`. They are samples, not a benchmark: a model that failed that day may pass tomorrow and vice versa. The samples ship as `samples.json`; the page treats them as data only — every SVG is re-validated in your browser by the same checks as a live run before it is drawn as an image, and every string is inserted as text. The same seven models are pinned at the top of the model picker under **Featured**; the rest of the list is alphabetical and now excludes image, video, embedding, rerank, speech and music models that cannot answer a chat prompt.

## Example request

```bash
curl https://crazyrouter.com/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "model": "gpt-6-astra",
  "messages": [
    {
      "role": "user",
      "content": "创建一幅独立的 SVG 鹈鹕骑自行车 2D 循环动画。…本次场景：海边木栈道。…在画面右下角用可见的 SVG text 元素显示本次校验码：AB12CD。…"
    }
  ],
  "stream": true,
  "stream_options": {
    "include_usage": true
  },
  "max_completion_tokens": 32000
}'
```

The Responses protocol sends the same prompt as `input: [{"role": "user", "content": …}]` with `stream: true`, `max_output_tokens: 32000` and `store: false`. The page concatenates the streamed deltas (`choices[0].delta.content` or `response.output_text.delta`) and reads usage from the final chunk. The full prompt text is visible in the page's request preview.

## Crazyrouter 模型竞技场（中文）

本 Space 复刻了 [manxue-ai](https://github.com/w1196396546/manxue-ai) 上广为流传的两道题：**鹈鹕骑自行车 SVG 动画** 和 **糖果抽屉原理题**。填入自己的 API Key，最多同时选 4 个模型，一次运行、并排比较。点击页面顶部的“中文”即可切换到中文界面。

- 鹈鹕题通过条件：回答里有完整的 `<svg>`，能按 XML 解析，不含脚本、事件属性、外部引用或 foreignObject，声明了动画（SMIL 或 CSS `@keyframes`），并且在 `<text>` 里显示本次校验码。三项全部满足才算通过。
- 糖果题通过条件：回答里出现独立的数字 `21`。这只是字符串匹配，不是语义判分。
- 提示词与判定规则逐字取自 manxue-ai，结果可与 manxue.ai 对照；两道题都不能证明模型身份或综合能力。

Key 只保留在页面内存中，只发送给你填写的接口地址，不写入 localStorage、sessionStorage 或 Cookie。本 Space 不提供共享 Key，每次运行按模型 × 题目各发一条真实请求，用你自己的余额计费，不自动重试。浏览器直接调用接口，因此接口必须允许跨域（Crazyrouter 的 `/v1/*` 已开启）；请求以流式（`stream: true`）发送并在页面内拼接，避免边缘网关在 100–120 秒后切断长回答；输出上限可选（8000 / 16000 / 32000 / 64000），默认 32000 而不是 manxue 的 16000：Claude 5 系列会把隐藏的自适应推理也计入上限（鹈鹕题实测 7k–16k 思考 token，走 `/v1/chat/completions` 和 `/v1/messages` 都一样），16000 会截断所有 Claude 的 SVG；要与 manxue 对照请选 16000。部分模型会以 HTTP 400 拒绝过高上限，那是上游限制而不是模型答错。

**示例与精选模型。** 竞技场下方的“示例”区展示了 7 个前沿模型——`gpt-6-astra`、`gpt-5`、`claude-opus-5-5`、`claude-fable-5-1`、`deepseek-v4-pro`、`kimi-k3`、`glm-5.3`——在 2026-09-28（UTC）经 Crazyrouter 实跑一次的真实回答：同样的提示词、所有模型共用同一场景和校验码、Chat Completions、未发送推理力度。首日失败的题目已于 2026-09-29 用同一场景和校验码重跑（每次尝试都记录在 `samples.json` 的 attempts 里）；重跑使用 32000 的输出上限（见上文），其中 `kimi-k3` 和 `glm-5.3` 还放宽到 900 秒，因为它们会先推理好几分钟才开始输出，而页面实时运行仍是 300 秒上限；每条记录都写明了实际的上限和超时。它们是样本，不是基准测试：当天失败的模型明天可能通过，反之亦然。样本以 `samples.json` 随页面发布，页面只把它当作数据——每个 SVG 都会在你的浏览器里经过与实时运行完全相同的校验后才绘制成图片，所有字符串都以文本方式插入。这 7 个模型同时固定在模型列表顶部的“精选”分组；其余模型按字母排序，并已剔除无法回答对话提示词的图片、视频、向量、重排、语音和音乐模型。

- [在 Crazyrouter 上无需 API Key 直接运行](https://crazyrouter.com/tools/zh/model-arena/?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)
- [Crazyrouter 模型与价格](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)
- [创建 Crazyrouter API Key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)
- [Crazyrouter API 文档](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)

## References and attribution

- [manxue-ai on GitHub](https://github.com/w1196396546/manxue-ai) — the reference implementation whose prompts and probe rules this Space reuses
- [Crazyrouter model catalogue](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)
- [Crazyrouter API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=model_arena)

Prompts and probe rules are from manxue-ai, Apache-2.0; this Space is maintained by Crazyrouter and is not affiliated with manxue.ai. No model weights are hosted here. Information checked on September 29, 2026; model availability and pricing may change.
