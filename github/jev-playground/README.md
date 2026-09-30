[Live demo](https://xujfcn.github.io/crazyrouter-tools/github/jev-playground/) · [All tools](../../README.md)


# JEV 1.13 Playground by Crazyrouter

Try **TypeSafe JEV 1.13** for structured AI decisions: classify support tickets, judge urgency, score relevance, and route AI agents. This English and Chinese playground includes 12 editable scenarios and JSON, cURL, JavaScript, and Python request examples.

**[Open the Crazyrouter JEV Playground](https://crazyrouter.com/tools/jev-decision-playground/?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)** · **[Read the JEV 1.13 hands-on guide](https://crazyrouter.com/en/blog/jev-1-13-guide-playground-2026-en?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)** · **[Create a Crazyrouter API key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)**

## What is JEV?

JEV is a decision model from TypeSafe. You provide a `state` and named `questions`; the model returns structured answers rather than a conversational response.

| Primitive | Purpose | Example |
| --- | --- | --- |
| Choice | Select among explicitly defined options | Route a ticket to billing, technical support, or sales |
| Noul | Estimate the probability of a yes/no judgment | Does this ticket express urgency? |
| Score | Rate against ordered criteria | Score document relevance on a 0-to-2 scale |

Score is a probability-weighted mean of zero-indexed levels, so it can be fractional. Confidence describes distribution certainty; it is not a validated accuracy score.

## Try a decision

1. Choose a scenario and edit its state and questions.
2. Paste your own Crazyrouter API token. Previewing a request does not require a key.
3. Run the decision and inspect answers, probability distributions, latency, token usage, and raw JSON.

The browser calls `https://crazyrouter.com/api/alpha/decisions` directly. Your key is held in page memory and is not stored in localStorage, sessionStorage, or cookies. The Space does not provide a shared API key or free inference. Actual requests use your Crazyrouter balance and are not automatically retried. An upstream-reported cost is not the final Crazyrouter charge; consult your usage logs.

The public model alias is `jev-1.13`; this playground sends `typesafe/jev-1.13`. The resolved version is shown in the response. Use the **Decisions API**, not a Chat Completions endpoint.

## Example request

```bash
curl https://crazyrouter.com/api/alpha/decisions \
  -H "Authorization: Bearer $CRAZYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"jev-1.13","state":"Our payment integration is down and customers cannot check out.","questions":{"is_urgent":{"type":"noul","instructions":"Does this issue require urgent attention?"},"department":{"type":"choice","instructions":"Which team should handle this?","criteria":{"technical":"Bugs or integration failures","billing":"Invoices or subscriptions","sales":"Pricing or purchasing"}}}}'
```

## Included scenarios

Support ticket routing, refund actions, product feedback, lead qualification, transaction risk review, vendor onboarding, content moderation, account takeover, compliance review, RAG passage evaluation, agent tool routing, and incident severity. Examples illustrate decision workflows, not validated production benchmarks.

## JEV 1.13 中文在线体验

JEV 是 TypeSafe 推出的结构化决策模型。输入背景 `state` 和问题 `questions`，通过 **Choice 分类、Noul 是非概率、Score 有序评分**，完成客服分流、退款判断、内容审核、Agent 路由和 RAG 相关性判断。

本 Space 提供中英文界面、12 个可编辑场景，以及请求预览和接入代码。点击应用顶部的“中文”即可切换；运行时需要填写自己的 Crazyrouter API Token，真实请求按账户规则计费。密钥只保留在页面内存中。JEV 不能直接替换 Claude Code 或 Codex 的对话主模型；应由程序把原子决策接入 Agent 工作流。

- [JEV 中文 Playground](https://crazyrouter.com/tools/zh/jev-decision-playground/?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)
- [JEV 1.13 怎么用：从客服分流到 Agent 路由的实测教程](https://crazyrouter.com/blog/jev-1-13-guide-playground-2026?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)
- [Crazyrouter 模型与价格](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)

## References and attribution

- [TypeSafe introduction](https://docs.typesafe.ai/introduction)
- [Official quickstart](https://docs.typesafe.ai/introduction/quickstart)
- [Score semantics](https://docs.typesafe.ai/primitives/score)
- [Understanding confidence](https://docs.typesafe.ai/confidence)
- [JEV with coding agents](https://docs.typesafe.ai/introduction/coding-agents)
- [Crazyrouter API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=jev_1_13_playground)

Maintained by Crazyrouter. JEV is a TypeSafe model; this Space is a third-party API playground, not an official TypeSafe Space or a model-weights release. Model weights are not hosted here. Information checked on September 23, 2026; availability and pricing may change.
