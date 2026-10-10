[Live demo](https://xujfcn.github.io/crazyrouter-tools/github/jev-playground/)

# JEV 1.13 Playground by Crazyrouter

Try **TypeSafe JEV 1.13** for structured AI decisions: classify support tickets, judge urgency, score relevance, and route AI agents. This English and Chinese playground includes 12 editable scenarios and JSON, cURL, JavaScript, and Python request examples.

**[Open the Crazyrouter JEV Playground](https://crazyrouter.com/tools/jev-decision-playground/?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_01__en)** · **[Read the JEV 1.13 hands-on guide](https://crazyrouter.com/en/blog/jev-1-13-guide-playground-2026-en?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_02__en)** · **[Create a Crazyrouter API key](https://crazyrouter.com/console/token?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_03__en)**

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

The browser calls `https://crazyrouter.com/api/alpha/decisions`?utm_source=github&utm_campaign=jev-playground&utm_content=readme_04__en&utm_medium=github_readme directly. Your key is held in page memory and is not stored in localStorage, sessionStorage, or cookies. The Space does not provide a shared API key or free inference. Actual requests use your Crazyrouter balance and are not automatically retried. An upstream-reported cost is not the final Crazyrouter charge; consult your usage logs.

The public model alias is `jev-1.13`; this playground sends `typesafe/jev-1.13`. The resolved version is shown in the response. Use the **Decisions API**, not a Chat Completions endpoint.

## Example request

```bash
curl https://crazyrouter.com/api/alpha/decisions?utm_source=github&utm_campaign=jev-playground&utm_content=readme_05__en&utm_medium=github_readme \
  -H "Authorization: Bearer $CRAZYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"jev-1.13","state":"Our payment integration is down and customers cannot check out.","questions":{"is_urgent":{"type":"noul","instructions":"Does this issue require urgent attention?"},"department":{"type":"choice","instructions":"Which team should handle this?","criteria":{"technical":"Bugs or integration failures","billing":"Invoices or subscriptions","sales":"Pricing or purchasing"}}}}'
```

## Included scenarios

Support ticket routing, refund actions, product feedback, lead qualification, transaction risk review, vendor onboarding, content moderation, account takeover, compliance review, RAG passage evaluation, agent tool routing, and incident severity. Examples illustrate decision workflows, not validated production benchmarks.

## JEV 1.13 中文在线体验

JEV 是 TypeSafe 推出的结构化决策模型。输入背景 `state` 和问题 `questions`，通过 **Choice 分类、Noul 是非概率、Score 有序评分**，完成客服分流、退款判断、内容审核、Agent 路由和 RAG 相关性判断。

本 Space 提供中英文界面、12 个可编辑场景，以及请求预览和接入代码。点击应用顶部的“中文”即可切换；运行时需要填写自己的 Crazyrouter API Token，真实请求按账户规则计费。密钥只保留在页面内存中。JEV 不能直接替换 Claude Code 或 Codex 的对话主模型；应由程序把原子决策接入 Agent 工作流。

- [JEV 中文 Playground](https://crazyrouter.com/tools/zh/jev-decision-playground/?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_06__en)
- [JEV 1.13 怎么用：从客服分流到 Agent 路由的实测教程](https://crazyrouter.com/blog/jev-1-13-guide-playground-2026?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_07__en)
- [Crazyrouter 模型与价格](https://crazyrouter.com/models?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_08__en)

## References and attribution

- [TypeSafe introduction](https://docs.typesafe.ai/introduction)
- [Official quickstart](https://docs.typesafe.ai/introduction/quickstart)
- [Score semantics](https://docs.typesafe.ai/primitives/score)
- [Understanding confidence](https://docs.typesafe.ai/confidence)
- [JEV with coding agents](https://docs.typesafe.ai/introduction/coding-agents)
- [Crazyrouter API documentation](https://docs.crazyrouter.com/?utm_source=github&utm_medium=github_readme&utm_campaign=jev-playground&utm_content=readme_09__en)

Maintained by Crazyrouter. JEV is a TypeSafe model; this Space is a third-party API playground, not an official TypeSafe Space or a model-weights release. Model weights are not hosted here. Information checked on September 23, 2026; availability and pricing may change.

<!-- channel-localized-access -->

## API access: 日本語 / 한국어 / Русский / Português

Documentation below is localized. The interactive interfaces retain their existing languages. Updated 2026-10-10.

### 日本語：API 接続と料金

料金は USD 表示です。API 呼び出しは従量課金です。長いコンテキストでは料金区分が変わる場合があります。データセットの全区分を確認してください。

API キーは環境変数に設定し、公開しないでください。モデル名は現在のモデル一覧で確認できます。

[モデルと料金](https://crazyrouter.com/ja/pricing?utm_source=github&utm_campaign=jev-playground&utm_content=guide_prices__ja&utm_medium=github_readme) · [API キーを作成](https://crazyrouter.com/console/token?utm_source=github&utm_campaign=jev-playground&utm_content=guide_api_key__ja&utm_medium=github_readme)

### 한국어: API 연결 및 요금

요금은 USD 기준이며 API 호출은 사용량에 따라 청구됩니다. 긴 컨텍스트에는 다른 요금 구간이 적용될 수 있습니다. 데이터셋의 전체 구간을 확인하세요.

API 키는 환경 변수로 설정하고 공개하지 마세요. 현재 모델 목록에서 모델 이름을 확인할 수 있습니다.

[모델 및 요금](https://crazyrouter.com/ko/pricing?utm_source=github&utm_campaign=jev-playground&utm_content=guide_prices__ko&utm_medium=github_readme) · [API 키 만들기](https://crazyrouter.com/console/token?utm_source=github&utm_campaign=jev-playground&utm_content=guide_api_key__ko&utm_medium=github_readme)

### Русский: подключение API и цены

Цены указаны в USD. Вызовы API оплачиваются по использованию. Для длинного контекста может действовать другой тариф. Все диапазоны приведены в наборе данных.

Храните ключ API в переменной окружения и не публикуйте его. Имена моделей доступны в текущем каталоге.

[Модели и цены](https://crazyrouter.com/ru/pricing?utm_source=github&utm_campaign=jev-playground&utm_content=guide_prices__ru&utm_medium=github_readme) · [Создать ключ API](https://crazyrouter.com/console/token?utm_source=github&utm_campaign=jev-playground&utm_content=guide_api_key__ru&utm_medium=github_readme)

### Português: acesso à API e preços

Os preços são em USD. As chamadas de API são cobradas por uso. Contextos longos podem ter outra faixa de preço. Consulte todas as faixas no conjunto de dados.

Guarde a chave de API numa variável de ambiente e não a publique. Os nomes dos modelos estão no catálogo atual.

[Modelos e preços](https://crazyrouter.com/pt/pricing?utm_source=github&utm_campaign=jev-playground&utm_content=guide_prices__pt&utm_medium=github_readme) · [Criar chave de API](https://crazyrouter.com/console/token?utm_source=github&utm_campaign=jev-playground&utm_content=guide_api_key__pt&utm_medium=github_readme)

```bash
curl https://crazyrouter.com/api/alpha/decisions?utm_source=github&utm_campaign=jev-playground&utm_content=readme__en&utm_medium=github_readme \
  -H "Authorization: Bearer $CRAZYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"jev-1.13","state":"The payment service is down.","questions":{"urgent":{"type":"noul","instructions":"Does this need urgent attention?"}}}'
```
