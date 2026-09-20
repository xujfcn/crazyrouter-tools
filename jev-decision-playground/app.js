const $ = (id) => document.getElementById(id);
const format = (value) => JSON.stringify(value, null, 2);
const ENDPOINT = 'https://crazyrouter.com/api/alpha/decisions';
const MODEL = 'typesafe/jev-1.13';

const messages = {
  zh: {
    skip: '跳到工作区', localWorkspace: 'CrazyRouter API', title: 'JEV 决策工作台',
    subtitle: '用一个接口完成分类、判断与评分，并获得可直接进入业务流程的结构化结果。',
    officialGuide: '官方指南', choiceDesc: '从明确选项中选择', noulDesc: '返回是与否的概率',
    scoreDesc: '沿有序标准评分', referencePrice: '参考价格', applications: '应用场景',
    applicationsDesc: '选择场景后，可继续修改背景和问题定义。', requestTitle: '请求配置',
    requestDesc: 'CrazyRouter Token 与决策输入', endpointLabel: '调用入口', modelLabel: '模型',
    tokenHint: 'Token 仅用于当前页面中的请求，不写入 localStorage、sessionStorage 或 Cookie。',
    scenarioLabel: '当前场景', stateLabel: '背景', plainText: '纯文本', jsonValue: 'JSON 对象 / 数组',
    questionsLabel: '问题定义', formatJson: '格式化 JSON',
    questionHint: 'Choice 使用选项对象，Score 使用从低到高的数组，Noul 可省略 criteria。',
    advancedFields: '高级字段', runDecision: '运行决策', previewRequest: '预览请求',
    billingHint: '提交会通过 CrazyRouter 发起真实计费请求；页面不会自动重试。', resultTitle: '决策结果',
    resultDesc: '结构化答案与请求指标', waiting: '等待运行', emptyTitle: '选择一个场景开始',
    emptyDesc: '运行后，这里会显示答案、概率分布、耗时与 Token 用量。',
    confidenceNote: 'Confidence 表示概率分布的确定程度，并非经过验证的正确率。',
    rawResponse: '完整响应 JSON', requestCode: '请求与接入代码（不含密钥）', copy: '复制', copied: '已复制',
    resources: 'SDK 与示例', resourcesDesc: '官方文档、客户端与社区项目', quickstart: 'TypeSafe 快速入门',
    footer: 'Token 仅保留在当前页面内存中', all: '全部', support: '客服与运营',
    business: '商业与风控', safety: '内容与安全', ai: 'AI 工作流', examples: '个场景',
    tokenSite: 'CrazyRouter API Token', siteTokenPlaceholder: '粘贴本站创建的 Token',
    invalidQuestions: '问题定义不是有效 JSON，请检查逗号和引号。', invalidExtra: '高级字段不是有效 JSON。',
    invalidState: '背景不是有效 JSON；普通文字请选择“纯文本”。', extraObject: '高级字段必须为 JSON 对象。',
    protectedFields: '高级字段不可覆盖 model/state/questions，也不应包含密钥。', needQuestion: '请至少定义一个问题。',
    needToken: '请先填写当前入口的 API Token。', probability: '概率', yes: '是', no: '否', points: '分',
    elapsed: '耗时', inputTokens: '输入 token', outputTokens: '输出 token', success: '成功', failure: '失败',
    noAnswers: '响应中没有 answers，请展开完整响应检查。', deploymentHint: '',
    upstreamCost: '上游报告费用', siteCostHint: '（不是本站实扣金额，实扣请查看本站消费日志）',
    actualModel: '实际模型', running: '正在运行…', runningButton: '正在请求，请稍候…',
    requesting: '正在请求 CrazyRouter，最长等待 60 秒。', localError: 'CrazyRouter 返回 HTTP {status}',
    timeout: '请求超时，请核对消费记录后再重试。', callFailed: '调用失败', noResult: 'CrazyRouter · 本次调用未取得有效结果',
    clipboardError: '无法访问剪贴板，请手动选择代码复制。',
  },
  en: {
    skip: 'Skip to workspace', localWorkspace: 'CrazyRouter API', title: 'JEV Decision Workspace',
    subtitle: 'Classify, judge, and score through one endpoint, then send structured results directly into your workflow.',
    officialGuide: 'Official guide', choiceDesc: 'Select from defined options', noulDesc: 'Return a yes/no probability',
    scoreDesc: 'Rate against ordered criteria', referencePrice: 'Reference price', applications: 'Applications',
    applicationsDesc: 'Choose a scenario, then edit its state and questions.', requestTitle: 'Request setup',
    requestDesc: 'CrazyRouter token and decision input', endpointLabel: 'Endpoint', modelLabel: 'Model',
    tokenHint: 'The token is used only by requests in this page and is never written to localStorage, sessionStorage, or cookies.',
    scenarioLabel: 'Current scenario',
    stateLabel: 'State', plainText: 'Plain text', jsonValue: 'JSON object / array', questionsLabel: 'Questions',
    formatJson: 'Format JSON', questionHint: 'Choice uses an option object, Score uses a low-to-high array, and Noul may omit criteria.',
    advancedFields: 'Advanced fields', runDecision: 'Run decision', previewRequest: 'Preview request',
    billingHint: 'Submitting makes a real paid request through CrazyRouter. The page does not retry automatically.',
    resultTitle: 'Decision result', resultDesc: 'Structured answers and request metrics', waiting: 'Waiting',
    emptyTitle: 'Choose a scenario to begin', emptyDesc: 'Answers, probability distributions, latency, and token usage will appear here.',
    confidenceNote: 'Confidence describes the certainty of a probability distribution. It is not a validated accuracy score.',
    rawResponse: 'Full response JSON', requestCode: 'Request and integration code (key omitted)', copy: 'Copy', copied: 'Copied',
    resources: 'SDKs and examples', resourcesDesc: 'Official docs, clients, and community projects', quickstart: 'TypeSafe quickstart',
    footer: 'The token stays only in this page\'s memory', all: 'All', support: 'Support & operations',
    business: 'Business & risk', safety: 'Content & safety', ai: 'AI workflows', examples: 'scenarios',
    tokenSite: 'CrazyRouter API Token', siteTokenPlaceholder: 'Paste a CrazyRouter token',
    invalidQuestions: 'Questions must be valid JSON. Check commas and quotation marks.', invalidExtra: 'Advanced fields must be valid JSON.',
    invalidState: 'State is not valid JSON. Select Plain text for unstructured text.', extraObject: 'Advanced fields must be a JSON object.',
    protectedFields: 'Advanced fields cannot override model/state/questions or contain credentials.', needQuestion: 'Define at least one question.',
    needToken: 'Enter an API token for the selected endpoint.', probability: 'probability', yes: 'Yes', no: 'No', points: 'points',
    elapsed: 'Latency', inputTokens: 'Input tokens', outputTokens: 'Output tokens', success: 'Success', failure: 'Failed',
    noAnswers: 'The response has no answers. Open the full response for details.', deploymentHint: '',
    upstreamCost: 'Upstream reported cost', siteCostHint: ' (not the CrazyRouter billed amount; check usage logs for billing)',
    actualModel: 'Resolved model', running: 'Running…', runningButton: 'Requesting…',
    requesting: 'Requesting CrazyRouter; timeout is 60 seconds.', localError: 'CrazyRouter returned HTTP {status}',
    timeout: 'The request timed out. Check usage logs before retrying.', callFailed: 'Request failed',
    noResult: 'CrazyRouter · no valid result returned', clipboardError: 'Clipboard access failed. Select and copy the code manually.',
  },
};

const categories = ['all', 'support', 'business', 'safety', 'ai'];
const examples = {
  support: {
    category: 'support', code: 'CS-01', types: ['Choice', 'Noul', 'Score'],
    zh: {
      name: '客服工单分流', desc: '部门、紧急度与情绪',
      state: '我尝试连接 Stripe 已经 3 天了，集成一直失败，正在损失销售额。请尽快处理。',
      questions: {
        department: { type: 'choice', instructions: '应该由哪个团队处理该工单？', criteria: { billing: '支付、账单或订阅问题', technical: '错误或集成故障', sales: '价格或采购问题' } },
        is_urgent: { type: 'noul', instructions: '这条消息是否表达了紧迫性？' },
        frustration: { type: 'score', instructions: '客户表现出的挫败程度如何？', criteria: ['平静陈述事实', '不满但克制', '非常愤怒或使用激烈措辞'] },
      },
    },
    en: {
      name: 'Support ticket routing', desc: 'Team, urgency, and sentiment',
      state: 'I have been trying to connect Stripe for 3 days and the integration keeps failing. I am losing sales. Please help as soon as possible.',
      questions: {
        department: { type: 'choice', instructions: 'Which team should handle this ticket?', criteria: { billing: 'Payments, invoices, or subscriptions', technical: 'Bugs or integration failures', sales: 'Pricing or purchasing questions' } },
        is_urgent: { type: 'noul', instructions: 'Does the message express urgency?' },
        frustration: { type: 'score', instructions: 'How frustrated does the customer appear?', criteria: ['Calm and factual', 'Frustrated but civil', 'Very angry or using strong language'] },
      },
    },
  },
  refund: {
    category: 'support', code: 'CS-02', types: ['Choice', 'Noul'],
    zh: {
      name: '退款动作判断', desc: '重复扣款与下一步动作',
      state: '客户的同一订单被扣款两次，两笔交易均已结算。客户要求退回重复支付的金额。',
      questions: {
        action: { type: 'choice', instructions: '选择最合适的客服动作。', criteria: { refund: '退回重复扣款', deny: '拒绝退款', investigate: '证据不足，进一步调查' } },
        duplicate_charge: { type: 'noul', instructions: '客户是否因同一笔购买被多次扣款？' },
      },
    },
    en: {
      name: 'Refund action', desc: 'Duplicate charge and next action',
      state: 'A customer was charged twice for the same order. Both charges have settled, and the customer asks for the duplicate payment back.',
      questions: {
        action: { type: 'choice', instructions: 'Choose the best support action.', criteria: { refund: 'Refund the duplicate charge', deny: 'Deny the refund', investigate: 'Investigate because evidence is incomplete' } },
        duplicate_charge: { type: 'noul', instructions: 'Was the customer charged more than once for the same purchase?' },
      },
    },
  },
  feedback: {
    category: 'support', code: 'OP-03', types: ['Choice', 'Score'],
    zh: {
      name: '产品反馈归类', desc: '主题与处理优先级',
      state: '新版账单页加载很慢，但最终可以打开。希望可以导出按项目分组的月度 CSV。',
      questions: {
        topic: { type: 'choice', instructions: '反馈的主要主题是什么？', criteria: { performance: '速度、稳定性或性能', feature_request: '新功能或能力建议', usability: '界面与易用性问题' } },
        priority: { type: 'score', instructions: '该反馈的处理优先级如何？', criteria: ['低：不影响核心流程', '中：影响效率但有替代方案', '高：阻断核心任务'] },
      },
    },
    en: {
      name: 'Product feedback', desc: 'Topic and handling priority',
      state: 'The new billing page loads slowly but eventually opens. I would also like a monthly CSV export grouped by project.',
      questions: {
        topic: { type: 'choice', instructions: 'What is the primary feedback topic?', criteria: { performance: 'Speed, stability, or performance', feature_request: 'Request for a new capability', usability: 'Interface or usability problem' } },
        priority: { type: 'score', instructions: 'How urgently should this feedback be handled?', criteria: ['Low: core workflow unaffected', 'Medium: slows work but has a workaround', 'High: blocks a core task'] },
      },
    },
  },
  lead: {
    category: 'business', code: 'BZ-01', types: ['Choice', 'Noul', 'Score'],
    zh: {
      name: '销售线索分级', desc: '意向、匹配度与优先级',
      state: { company: 'Northstar Analytics', employees: 180, request: '需要为 35 名工程师统一接入多家模型，下周希望进行技术评估。', budget_confirmed: false },
      questions: {
        stage: { type: 'choice', instructions: '该线索处于哪个阶段？', criteria: { research: '早期调研', evaluation: '正在比较并计划评估', purchase: '已经准备采购' } },
        needs_sales_call: { type: 'noul', instructions: '是否应该安排销售沟通？' },
        fit: { type: 'score', instructions: '该线索与 API 网关产品的匹配度如何？', criteria: ['低匹配', '部分匹配', '高度匹配'] },
      },
    },
    en: {
      name: 'Lead qualification', desc: 'Intent, fit, and priority',
      state: { company: 'Northstar Analytics', employees: 180, request: 'We need unified model access for 35 engineers and want a technical evaluation next week.', budget_confirmed: false },
      questions: {
        stage: { type: 'choice', instructions: 'Which buying stage is this lead in?', criteria: { research: 'Early research', evaluation: 'Comparing options and planning an evaluation', purchase: 'Ready to purchase' } },
        needs_sales_call: { type: 'noul', instructions: 'Should a sales call be scheduled?' },
        fit: { type: 'score', instructions: 'How well does the lead fit an API gateway product?', criteria: ['Low fit', 'Partial fit', 'Strong fit'] },
      },
    },
  },
  transaction: {
    category: 'business', code: 'RK-02', types: ['Choice', 'Noul', 'Score'],
    zh: {
      name: '交易风险审查', desc: '风险动作与异常程度',
      state: { amount_usd: 2480, account_age_days: 3, country: 'US', card_country: 'BR', attempts_10m: 5, prior_chargebacks: 1 },
      questions: {
        action: { type: 'choice', instructions: '选择交易处理动作。', criteria: { approve: '直接通过', review: '交给人工复核', block: '阻止交易' } },
        suspicious: { type: 'noul', instructions: '该交易是否表现出明显异常？' },
        risk: { type: 'score', instructions: '交易风险等级如何？', criteria: ['低风险', '中等风险', '高风险'] },
      },
    },
    en: {
      name: 'Transaction review', desc: 'Risk action and anomaly level',
      state: { amount_usd: 2480, account_age_days: 3, country: 'US', card_country: 'BR', attempts_10m: 5, prior_chargebacks: 1 },
      questions: {
        action: { type: 'choice', instructions: 'Choose how to handle the transaction.', criteria: { approve: 'Approve immediately', review: 'Send to manual review', block: 'Block the transaction' } },
        suspicious: { type: 'noul', instructions: 'Does the transaction show clear anomalies?' },
        risk: { type: 'score', instructions: 'What is the transaction risk level?', criteria: ['Low risk', 'Medium risk', 'High risk'] },
      },
    },
  },
  vendor: {
    category: 'business', code: 'RK-03', types: ['Choice', 'Noul'],
    zh: {
      name: '供应商准入', desc: '材料完整性与审查路径',
      state: { service: '日志分析 SaaS', data_access: '脱敏后的应用日志', soc2: true, dpa_signed: false, subprocessors_disclosed: true },
      questions: {
        review_path: { type: 'choice', instructions: '选择供应商审查路径。', criteria: { standard: '标准审查', legal: '补充法务审查', security: '深入安全审查', reject: '拒绝准入' } },
        documentation_complete: { type: 'noul', instructions: '必要的合规材料是否完整？' },
      },
    },
    en: {
      name: 'Vendor onboarding', desc: 'Documentation and review path',
      state: { service: 'Log analytics SaaS', data_access: 'Redacted application logs', soc2: true, dpa_signed: false, subprocessors_disclosed: true },
      questions: {
        review_path: { type: 'choice', instructions: 'Choose the vendor review path.', criteria: { standard: 'Standard review', legal: 'Additional legal review', security: 'Deep security review', reject: 'Reject onboarding' } },
        documentation_complete: { type: 'noul', instructions: 'Is the required compliance documentation complete?' },
      },
    },
  },
  moderation: {
    category: 'safety', code: 'SF-01', types: ['Choice', 'Score'],
    zh: {
      name: '内容审核分流', desc: '违规类别与严重程度',
      state: '评论内容：你就是个骗子，我会把你的家庭住址发到所有群里，让大家去找你。',
      questions: {
        policy: { type: 'choice', instructions: '内容主要触犯哪类规则？', criteria: { harassment: '侮辱、骚扰或威胁', privacy: '泄露或威胁泄露个人信息', spam: '垃圾信息或无关推广', allowed: '没有明显违规' } },
        severity: { type: 'score', instructions: '违规严重程度如何？', criteria: ['轻微', '需要限制或警告', '严重，需立即处理'] },
      },
    },
    en: {
      name: 'Content moderation', desc: 'Policy class and severity',
      state: 'Comment: You are a fraud. I will post your home address in every group so people can come find you.',
      questions: {
        policy: { type: 'choice', instructions: 'Which policy area is primarily implicated?', criteria: { harassment: 'Insults, harassment, or threats', privacy: 'Sharing or threatening to share personal information', spam: 'Spam or irrelevant promotion', allowed: 'No clear violation' } },
        severity: { type: 'score', instructions: 'How severe is the violation?', criteria: ['Minor', 'Needs restriction or warning', 'Severe and requires immediate action'] },
      },
    },
  },
  takeover: {
    category: 'safety', code: 'SF-02', types: ['Choice', 'Noul'],
    zh: {
      name: '账号接管检测', desc: '登录事件与处置动作',
      state: { usual_country: 'SG', login_country: 'DE', new_device: true, impossible_travel: true, password_reset_minutes_ago: 8, mfa_passed: false },
      questions: {
        action: { type: 'choice', instructions: '选择账号保护动作。', criteria: { allow: '允许登录', challenge: '要求额外验证', lock: '临时锁定账号并通知用户' } },
        likely_takeover: { type: 'noul', instructions: '该事件是否可能是账号接管？' },
      },
    },
    en: {
      name: 'Account takeover', desc: 'Login event and response',
      state: { usual_country: 'SG', login_country: 'DE', new_device: true, impossible_travel: true, password_reset_minutes_ago: 8, mfa_passed: false },
      questions: {
        action: { type: 'choice', instructions: 'Choose the account protection action.', criteria: { allow: 'Allow login', challenge: 'Require additional verification', lock: 'Temporarily lock and notify the user' } },
        likely_takeover: { type: 'noul', instructions: 'Is this event likely an account takeover?' },
      },
    },
  },
  compliance: {
    category: 'safety', code: 'SF-03', types: ['Choice', 'Noul', 'Score'],
    zh: {
      name: '合规文档检查', desc: '条款定位与风险评分',
      state: { document_type: '数据处理协议', excerpt: '供应商可无限期保留服务日志，并可在不通知客户的情况下将数据用于产品改进。' },
      questions: {
        issue: { type: 'choice', instructions: '最主要的合规问题是什么？', criteria: { retention: '保留期限不明确或过长', secondary_use: '未经明确授权的二次使用', notification: '通知义务不足', none: '未发现明显问题' } },
        needs_legal_review: { type: 'noul', instructions: '该条款是否需要法务复核？' },
        risk: { type: 'score', instructions: '条款风险如何？', criteria: ['低', '中', '高'] },
      },
    },
    en: {
      name: 'Compliance review', desc: 'Clause classification and risk',
      state: { document_type: 'Data Processing Agreement', excerpt: 'The vendor may retain service logs indefinitely and use them for product improvement without notifying the customer.' },
      questions: {
        issue: { type: 'choice', instructions: 'What is the primary compliance issue?', criteria: { retention: 'Undefined or excessive retention', secondary_use: 'Secondary use without clear authorization', notification: 'Insufficient notice obligation', none: 'No clear issue' } },
        needs_legal_review: { type: 'noul', instructions: 'Does this clause require legal review?' },
        risk: { type: 'score', instructions: 'How risky is the clause?', criteria: ['Low', 'Medium', 'High'] },
      },
    },
  },
  rag: {
    category: 'ai', code: 'AI-01', types: ['Score', 'Noul'],
    zh: {
      name: 'RAG 片段评估', desc: '相关性与可回答性',
      state: { query: '如何重置 API Key？', passage: '在控制台进入 API 密钥页面，撤销旧密钥后创建新密钥。更新应用的环境变量，再重启服务。' },
      questions: {
        relevance: { type: 'score', instructions: '片段对回答 query 的相关程度如何？', criteria: ['无关', '部分相关但缺少关键步骤', '直接相关且可操作'] },
        answers_query: { type: 'noul', instructions: 'passage 是否提供了 query 所需的方法？' },
      },
    },
    en: {
      name: 'RAG passage evaluation', desc: 'Relevance and answerability',
      state: { query: 'How do I reset an API key?', passage: 'Open API Keys in the console, revoke the old key, and create a new one. Update the application environment variable and restart the service.' },
      questions: {
        relevance: { type: 'score', instructions: 'How relevant is the passage to the query?', criteria: ['Irrelevant', 'Partially relevant but missing key steps', 'Directly relevant and actionable'] },
        answers_query: { type: 'noul', instructions: 'Does the passage provide the method requested by the query?' },
      },
    },
  },
  tool: {
    category: 'ai', code: 'AI-02', types: ['Choice', 'Noul'],
    zh: {
      name: '智能体工具路由', desc: '工具选择与人工接管',
      state: '用户：查一下北京明天下午是否下雨，如果降雨概率超过 60%，就把周三 15:00 的户外拍摄改到周四。',
      questions: {
        first_tool: { type: 'choice', instructions: '智能体首先应该调用哪个工具？', criteria: { weather: '查询天气预报', calendar: '读取或修改日历', messaging: '发送通知', none: '不需要工具' } },
        needs_confirmation: { type: 'noul', instructions: '执行日程变更前是否需要用户确认？' },
      },
    },
    en: {
      name: 'Agent tool routing', desc: 'Tool selection and confirmation',
      state: 'User: Check whether it will rain in Beijing tomorrow afternoon. If the chance is above 60%, move Wednesday’s 15:00 outdoor shoot to Thursday.',
      questions: {
        first_tool: { type: 'choice', instructions: 'Which tool should the agent call first?', criteria: { weather: 'Get a weather forecast', calendar: 'Read or update the calendar', messaging: 'Send a notification', none: 'No tool is needed' } },
        needs_confirmation: { type: 'noul', instructions: 'Should the agent ask for confirmation before changing the calendar?' },
      },
    },
  },
  incident: {
    category: 'ai', code: 'AI-03', types: ['Choice', 'Score', 'Noul'],
    zh: {
      name: '生产事故分级', desc: '严重级别与升级判断',
      state: { service: 'payments-api', error_rate: '18.7%', affected_regions: ['ap-southeast-1', 'eu-central-1'], duration_minutes: 14, workaround: false },
      questions: {
        owner: { type: 'choice', instructions: '事故应该升级给哪个团队？', criteria: { payments: '支付平台团队', infrastructure: '基础设施团队', vendor: '外部供应商', support: '客户支持团队' } },
        severity: { type: 'score', instructions: '事故严重程度如何？', criteria: ['SEV-3：影响有限', 'SEV-2：显著降级', 'SEV-1：核心服务大面积不可用'] },
        page_oncall: { type: 'noul', instructions: '是否应立即呼叫值班工程师？' },
      },
    },
    en: {
      name: 'Incident severity', desc: 'Severity and escalation',
      state: { service: 'payments-api', error_rate: '18.7%', affected_regions: ['ap-southeast-1', 'eu-central-1'], duration_minutes: 14, workaround: false },
      questions: {
        owner: { type: 'choice', instructions: 'Which team should own the incident?', criteria: { payments: 'Payments platform', infrastructure: 'Infrastructure', vendor: 'External vendor', support: 'Customer support' } },
        severity: { type: 'score', instructions: 'How severe is the incident?', criteria: ['SEV-3: limited impact', 'SEV-2: significant degradation', 'SEV-1: broad core-service outage'] },
        page_oncall: { type: 'noul', instructions: 'Should the on-call engineer be paged immediately?' },
      },
    },
  },
};

let running = false;
let snapshot;
let lastResult;
let codeMode = 'json';
let language = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
let activeCategory = 'all';

function t(key, replacements = {}) {
  let value = messages[language][key] ?? key;
  for (const [name, replacement] of Object.entries(replacements)) value = value.replace(`{${name}}`, replacement);
  return value;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showError(message) {
  $('error').textContent = message;
  $('error').hidden = !message;
}

function renderStaticText() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = language === 'zh' ? 'JEV 决策工作台 · CrazyRouter' : 'JEV Decision Workspace · CrazyRouter';
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
}

function renderCategoryTabs() {
  $('category-tabs').replaceChildren();
  for (const category of categories) {
    const count = category === 'all' ? Object.keys(examples).length : Object.values(examples).filter((item) => item.category === category).length;
    const button = element('button', category === activeCategory ? 'active' : '');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(category === activeCategory));
    button.append(element('span', '', t(category)), element('small', '', String(count)));
    button.addEventListener('click', () => { activeCategory = category; renderCategoryTabs(); renderApplicationList(); });
    $('category-tabs').append(button);
  }
}

function renderApplicationList() {
  $('application-list').replaceChildren();
  const visible = Object.entries(examples).filter(([, item]) => activeCategory === 'all' || item.category === activeCategory);
  $('application-count').textContent = `${visible.length} ${t('examples')}`;
  for (const [id, item] of visible) {
    const localized = item[language];
    const button = element('button', 'application-item');
    button.type = 'button';
    button.classList.toggle('selected', $('example').value === id);
    button.setAttribute('aria-pressed', String($('example').value === id));
    const code = element('span', 'application-code', item.code);
    const content = element('span', 'application-content');
    content.append(element('strong', '', localized.name), element('small', '', localized.desc));
    const types = element('span', 'application-types');
    for (const type of item.types) types.append(element('span', '', type));
    button.append(code, content, types);
    button.addEventListener('click', () => {
      $('example').value = id;
      loadExample();
      document.querySelector('.editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('application-list').append(button);
  }
}

function renderExampleOptions() {
  const selected = $('example').value || 'support';
  $('example').replaceChildren();
  for (const [id, item] of Object.entries(examples)) {
    const option = element('option', '', `${item.code} · ${item[language].name}`);
    option.value = id;
    $('example').append(option);
  }
  $('example').value = examples[selected] ? selected : 'support';
}

function currentExampleMatches(lang) {
  const item = examples[$('example').value]?.[lang];
  if (!item) return false;
  const state = typeof item.state === 'string' ? item.state : format(item.state);
  return $('state').value === state && $('questions').value === format(item.questions);
}

function loadExample() {
  const item = examples[$('example').value];
  const localized = item[language];
  $('state-format').value = typeof localized.state === 'string' ? 'text' : 'json';
  $('state').value = typeof localized.state === 'string' ? localized.state : format(localized.state);
  $('questions').value = format(localized.questions);
  $('extra').value = '{}';
  $('example-category').textContent = t(item.category);
  showError('');
  renderApplicationList();
}

function readPayload() {
  let questions;
  let state;
  let extra;
  try { questions = JSON.parse($('questions').value); } catch { throw new Error(t('invalidQuestions')); }
  try { extra = JSON.parse($('extra').value); } catch { throw new Error(t('invalidExtra')); }
  try { state = $('state-format').value === 'json' ? JSON.parse($('state').value) : $('state').value; } catch { throw new Error(t('invalidState')); }
  if (!extra || Array.isArray(extra) || typeof extra !== 'object') throw new Error(t('extraObject'));
  if (['model', 'state', 'questions', 'token', 'api_key', 'authorization'].some((key) => Object.hasOwn(extra, key))) throw new Error(t('protectedFields'));
  if (!questions || typeof questions !== 'object' || Array.isArray(questions) || !Object.keys(questions).length) throw new Error(t('needQuestion'));
  return { ...extra, model: MODEL, state, questions };
}

function makeSnapshot(payload) {
  return { payload, endpoint: ENDPOINT, timestamp: new Date() };
}

function codeText() {
  if (!snapshot) return '';
  const body = format(snapshot.payload);
  const keyName = 'CRAZYROUTER_API_KEY';
  if (codeMode === 'curl') return `# Bash / macOS / Linux\ncurl '${snapshot.endpoint}' \\\n+  -H "Authorization: Bearer $${keyName}" \\\n+  -H 'Content-Type: application/json' \\\n+  --data-binary @- <<'JEV_JSON'\n${body}\nJEV_JSON`;
  if (codeMode === 'js') return `// Node.js 20+\nconst response = await fetch(${JSON.stringify(snapshot.endpoint)}, {\n  method: 'POST',\n  headers: {\n    Authorization: 'Bearer ' + process.env.${keyName},\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${body}),\n});\nconst data = await response.json();\nif (!response.ok) throw new Error(JSON.stringify(data));\nconsole.log(data.answers);`;
  if (codeMode === 'python') return `# Python 3 · standard library\nimport json, os, urllib.request\n\npayload = json.loads(${JSON.stringify(body)})\nrequest = urllib.request.Request(\n    ${JSON.stringify(snapshot.endpoint)},\n    data=json.dumps(payload).encode('utf-8'),\n    headers={\n        'Authorization': 'Bearer ' + os.environ['${keyName}'],\n        'Content-Type': 'application/json',\n    },\n    method='POST',\n)\nwith urllib.request.urlopen(request, timeout=60) as response:\n    print(json.load(response)['answers'])`;
  return body;
}

function renderedCode() { return codeText().replaceAll('\n+', '\n'); }
function updateCode() { $('request-code').textContent = renderedCode(); }

function preview(payload) {
  snapshot = makeSnapshot(payload);
  $('request-section').hidden = false;
  updateCode();
}

function probability(parent, label, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return;
  const row = element('div', 'probability');
  row.append(element('span', '', label), element('span', '', `${(value * 100).toFixed(1)}%`));
  const bar = element('progress');
  bar.max = 1;
  bar.value = Math.max(0, Math.min(1, value));
  bar.setAttribute('aria-label', `${label} ${t('probability')}`);
  row.append(bar);
  parent.append(row);
}

function renderAnswers(data) {
  $('answers').replaceChildren();
  for (const [name, answer] of Object.entries(data.answers)) {
    if (!answer || typeof answer !== 'object') continue;
    const card = element('article', 'answer');
    const head = element('div', 'answer-head');
    head.append(element('b', '', name), element('span', 'type', String(answer.type || 'ANSWER').toUpperCase()));
    card.append(head);
    let value = '—';
    if (answer.type === 'choice') value = String(answer.choice ?? '—');
    if (answer.type === 'noul' && typeof answer.noul === 'number') value = `${(answer.noul * 100).toFixed(1)}% ${t('yes')}`;
    if (answer.type === 'score' && typeof answer.score === 'number') value = `${answer.score.toFixed(2)} ${t('points')}`;
    card.append(element('div', 'answer-value', value));
    if (typeof answer.confidence === 'number') card.append(element('div', 'confidence', `Confidence · ${(answer.confidence * 100).toFixed(1)}%`));
    if (answer.type === 'noul') {
      probability(card, `${t('yes')} / True`, answer.noul);
      probability(card, `${t('no')} / False`, 1 - answer.noul);
    }
    for (const [option, probabilityValue] of Object.entries(answer.probabilities || {})) {
      let label = option;
      if (answer.legend && Object.hasOwn(answer.legend, option)) label += ` · ${typeof answer.legend[option] === 'string' ? answer.legend[option] : JSON.stringify(answer.legend[option])}`;
      probability(card, label, probabilityValue);
    }
    $('answers').append(card);
  }
}

function renderResult(result, requestSnapshot) {
  $('empty').hidden = true;
  $('result-source').textContent = `CrazyRouter · ${requestSnapshot.payload.model} · ${requestSnapshot.timestamp.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US')}`;
  $('raw-section').hidden = false;
  $('raw').textContent = format(result.data);
  $('metrics').replaceChildren();
  $('metrics').hidden = false;
  const usage = result.data?.usage || {};
  const metricValues = [[t('elapsed'), `${(result.elapsedMs / 1000).toFixed(2)} s`], [t('inputTokens'), usage.input_tokens ?? '—'], [t('outputTokens'), usage.output_tokens ?? '—']];
  for (const [label, value] of metricValues) {
    const metric = element('div', 'metric');
    metric.append(element('small', '', label), element('b', '', String(value)));
    $('metrics').append(metric);
  }
  const success = result.status === 200 && !result.data?.error && result.data?.answers && typeof result.data.answers === 'object';
  $('status').textContent = `HTTP ${result.status} · ${t(success ? 'success' : 'failure')}`;
  $('status').className = `status ${success ? 'success' : 'failure'}`;
  $('confidence-note').hidden = !success;
  if (!success) {
    const error = result.data?.error;
    let message = typeof error === 'string' ? error : error?.message || t('noAnswers');
    if (result.status === 404) message += t('deploymentHint');
    showError(message);
    $('answers').replaceChildren();
    return;
  }
  renderAnswers(result.data);
  if (typeof usage.cost === 'number') {
    $('answers').append(element('p', 'hint', `${t('upstreamCost')}: $${usage.cost.toFixed(9)}${t('siteCostHint')}`));
  }
  $('answers').append(element('p', 'hint', `${t('actualModel')}: ${result.data.model || '—'} · Provider: ${result.data.provider || '—'}`));
}

function setBusy(value) {
  running = value;
  for (const control of $('request-form').querySelectorAll('input,select,textarea,button')) control.disabled = value;
  if (!value) $('model').disabled = true;
  $('run').firstElementChild.textContent = value ? t('runningButton') : t('runDecision');
  $('results').setAttribute('aria-busy', String(value));
}

$('request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (running) return;
  showError('');
  let payload;
  try {
    payload = readPayload();
    if (!$('token').value.trim()) throw new Error(t('needToken'));
  } catch (error) {
    showError(error.message);
    return;
  }
  preview(payload);
  const submitted = snapshot;
  const token = $('token').value.trim();
  setBusy(true);
  $('status').textContent = t('running');
  $('status').className = 'status';
  $('answers').replaceChildren();
  $('metrics').hidden = true;
  $('raw-section').hidden = true;
  $('confidence-note').hidden = true;
  $('result-source').textContent = t('requesting');
  const started = performance.now();
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(65000),
    });
    let data;
    try { data = await response.json(); }
    catch { data = { error: { message: t('localError', { status: response.status }) } }; }
    const result = { status: response.status, elapsedMs: Math.round(performance.now() - started), data };
    lastResult = result;
    renderResult(result, submitted);
  } catch (error) {
    showError(error.name === 'TimeoutError' ? t('timeout') : error.message);
    $('status').textContent = t('callFailed');
    $('status').className = 'status failure';
    $('result-source').textContent = t('noResult');
  } finally {
    setBusy(false);
  }
});

$('example').addEventListener('change', () => {
  activeCategory = examples[$('example').value].category;
  renderCategoryTabs();
  loadExample();
});
$('format-json').addEventListener('click', () => {
  try { $('questions').value = format(JSON.parse($('questions').value)); showError(''); }
  catch { showError(t('invalidQuestions')); }
});
$('preview').addEventListener('click', () => {
  try { preview(readPayload()); $('request-section').open = true; showError(''); }
  catch (error) { showError(error.message); }
});
for (const button of document.querySelectorAll('[data-code]')) {
  button.addEventListener('click', () => {
    codeMode = button.dataset.code;
    document.querySelectorAll('[data-code]').forEach((node) => node.classList.toggle('active', node === button));
    updateCode();
  });
}
$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(renderedCode());
    $('copy').textContent = t('copied');
    setTimeout(() => { $('copy').textContent = t('copy'); }, 1500);
  } catch {
    showError(t('clipboardError'));
  }
});

renderStaticText();
renderExampleOptions();
renderCategoryTabs();
loadExample();
$('endpoint').textContent = ENDPOINT;
$('model').value = MODEL;
$('model').disabled = true;
