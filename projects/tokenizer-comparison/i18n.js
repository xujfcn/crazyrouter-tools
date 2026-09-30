export const LANGUAGES=['en','zh','ja','ko'];
// Each row has the same key in English, Chinese, Japanese and Korean.
const copy={
  pageTitle:['Token Counter & Tokenizer Comparison — CrazyRouter','Token 数量与分词器对比 — CrazyRouter','トークン数・トークナイザー比較 — CrazyRouter','토큰 수 및 토크나이저 비교 — CrazyRouter'],
  description:['Compare Qwen, DeepSeek, Mistral, GPT, GLM, Kimi and legacy Claude tokenizers privately in your browser.','在浏览器本地对比 Qwen、DeepSeek、Mistral、GPT、GLM、Kimi 和 Claude 旧版分词器。','Qwen、DeepSeek、Mistral、GPT、GLM、Kimi、旧版 Claude のトークナイザーをブラウザー内で比較。','Qwen, DeepSeek, Mistral, GPT, GLM, Kimi, 구형 Claude 토크나이저를 브라우저에서 비교하세요.'],
  language:['Language','语言','言語','언어'],free:['FREE · NO LOGIN','免费 · 无需登录','無料 · ログイン不要','무료 · 로그인 불필요'],
  eyebrow:['ONE PROMPT. EIGHT TOKENIZERS.','一段文本，八种分词器。','ひとつの入力。8 種類のトークナイザー。','하나의 입력. 8가지 토크나이저.'],
  headline:['Same text.','同一段输入。','同じテキスト。','같은 텍스트.'],
  headlineAccent:['Different token counts.','不同的 token 数量。','異なるトークン数。','서로 다른 토큰 수.'],
  intro:['Compare token counts, inspect token pieces and estimate input costs across model families.','一次比较不同模型的 token 数量、分词细节和输入费用。','モデルごとのトークン数、分割結果、入力コストをまとめて比較できます。','모델별 토큰 수와 분할 결과를 비교하고 입력 비용을 계산하세요.'],
  privacy:['Runs in your browser. Your text stays on your device.','在浏览器本地计算，输入文本不上传。','ブラウザー内で処理します。入力テキストは送信されません。','브라우저에서 처리하며 입력 텍스트를 업로드하지 않습니다.'],
  form:['Token comparison form','分词对比表单','トークン比較フォーム','토큰 비교 입력'],
  input:['01 / YOUR TEXT','01 / 输入文本','01 / 入力テキスト','01 / 입력 텍스트'],
  placeholder:['Paste a prompt, code, or multilingual text…','粘贴提示词、代码或多语言文本…','プロンプト、コード、多言語のテキストを貼り付け…','프롬프트, 코드 또는 여러 언어의 텍스트를 붙여 넣으세요…'],
  examples:['TRY AN EXAMPLE','试用示例','サンプルを試す','예제 사용'],code:['Code','代码','コード','코드'],mixed:['Mixed + Emoji','混合 + Emoji','多言語 + 絵文字','다국어 + 이모지'],clear:['Clear','清空','クリア','지우기'],
  choices:['02 / TOKENIZERS','02 / 选择分词器','02 / トークナイザー','02 / 토크나이저'],
  scope:['GPT rows identify encodings, not all GPT models. GLM-5 and Kimi K2.5 use their published tokenizer data.','GPT 行代表编码方案，并非所有 GPT 模型。GLM-5 和 Kimi K2.5 使用各自公开的分词数据。','GPT の行はモデルではなくエンコーディングです。GLM-5 と Kimi K2.5 は公開の分詞データを使用します。','GPT 행은 모든 GPT 모델이 아닌 인코딩을 나타냅니다. GLM-5와 Kimi K2.5는 각 모델의 공개 토크나이저 데이터를 사용합니다.'],
  legacyLabel:['Claude · legacy reference','Claude · 旧版参考','Claude · 旧版参考','Claude · 구형 참고용'],
  legacyNote:['Claude uses Anthropic’s legacy tokenizer (0.0.4). It is not accurate for Claude 3 or later, including current Sonnet, Opus and Haiku. Use Anthropic’s count_tokens API for current models.','Claude 使用 Anthropic 官方旧版分词器（0.0.4），不适用于 Claude 3 及之后模型，包括当前 Sonnet、Opus 和 Haiku 的精确计数；请用官方 count_tokens API。','Claude は Anthropic の旧版トークナイザー（0.0.4）です。現在の Sonnet、Opus、Haiku を含む Claude 3 以降の正確な計数には使えません。最新モデルには公式 count_tokens API を使用してください。','Claude는 Anthropic의 구형 토크나이저(0.0.4)를 사용합니다. 현재 Sonnet, Opus, Haiku를 포함한 Claude 3 이후 모델의 정확한 계산에는 사용할 수 없습니다. 최신 모델은 공식 count_tokens API를 사용하세요.'],
  rateTitle:['Optional input cost estimate','可选：输入费用试算','任意：入力コストの試算','선택: 입력 비용 계산'],
  rateNote:['Enter your USD rate per 1 million input tokens. Blank means no estimate. These are not live CrazyRouter prices. Output, cache and other charges are excluded. Claude’s estimate is for the legacy tokenizer only.','填写每百万输入 token 美元单价，留空不估算。这不是本站实时报价，不含输出、缓存等费用。Claude 费用仅为旧版分词器的假设试算。','入力 100 万トークンあたりの米ドル単価を入力してください。空欄は試算なしです。CrazyRouter のリアルタイム価格ではありません。出力・キャッシュ等の料金は含みません。Claude の試算は旧版に限ります。','입력 토큰 100만 개당 USD 단가를 입력하세요. 비워 두면 계산하지 않습니다. CrazyRouter 실시간 가격이 아니며 출력, 캐시 등의 비용은 제외됩니다. Claude 비용은 구형 토크나이저 기준입니다.'],
  compare:['Compare tokens ↗','开始对比 ↗','トークンを比較 ↗','토큰 비교 ↗'],cancel:['Cancel','取消','キャンセル','취소'],
  download:['First use downloads selected tokenizer data; later comparisons reuse it. No model weights or API key needed.','首次下载所选分词器，之后复用。无需模型权重或 API Key。','初回のみ選択した分詞データを読み込み、以降は再利用します。モデルの重みや API キーは不要です。','처음에 선택한 토크나이저 데이터를 내려받고 이후 재사용합니다. 모델 가중치나 API 키는 필요하지 않습니다.'],
  ready:['Enter text to compare.','输入文本后开始对比。','テキストを入力して比較してください。','텍스트를 입력한 후 비교하세요.'],
  edited:['Input changed. Compare again to update results.','输入已修改，请重新对比。','入力が変更されました。再度比較してください。','입력이 변경되었습니다. 다시 비교하세요.'],
  cancelled:['Cancelled.','已取消。','キャンセルしました。','취소되었습니다.'],
  loading:['Loading tokenizer data…','正在加载分词器…','トークナイザーを読み込み中…','토크나이저를 불러오는 중…'],
  progress:['Loading / counting {model}…','正在加载并计算 {model}…','{model} を読み込み・計数中…','{model} 로딩 및 계산 중…'],
  done:['{good}/{total} tokenizers ready','{good}/{total} 分词器已完成','{good}/{total} トークナイザー完了','{good}/{total} 토크나이저 완료'],
  failedSome:['Some downloads failed. Compare again to retry.','部分加载失败，可重新对比重试。','一部の読み込みに失敗しました。再度比較してお試しください。','일부 다운로드에 실패했습니다. 다시 비교하여 재시도하세요.'],
  errorEmpty:['Enter some text first.','请先输入文本。','先にテキストを入力してください。','먼저 텍스트를 입력하세요.'],
  errorLength:['Maximum 50,000 characters.','最多输入 50,000 个字符。','50,000 文字まで入力できます。','최대 50,000자까지 입력할 수 있습니다.'],
  errorSelection:['Choose at least one tokenizer.','请至少选择一个分词器。','トークナイザーを 1 つ以上選んでください。','토크나이저를 하나 이상 선택하세요.'],
  errorRate:['Rates must be finite, non-negative numbers.','单价必须是非负有限数值。','単価には 0 以上の有限の数値を入力してください。','단가는 0 이상의 유한한 숫자여야 합니다.'],
  errorWorker:['Tokenizer worker unavailable. Compare again to retry.','分词线程不可用，请重试。','分詞処理を開始できません。再度比較してください。','토크나이저 작업을 시작할 수 없습니다. 다시 비교하세요.'],
  errorTimeout:['Timed out. Select fewer tokenizers and retry.','超时，请减少所选分词器后重试。','タイムアウトしました。選択数を減らして再試行してください。','시간이 초과되었습니다. 선택한 토크나이저 수를 줄여 재시도하세요.'],
  results:['Comparison results','对比结果','比較結果','비교 결과'],resultsTitle:['03 / THE COMPARISON','03 / 对比结果','03 / 比較結果','03 / 비교 결과'],
  stats:['{chars} characters · {bytes} UTF-8 bytes','{chars} 字符 · {bytes} UTF-8 字节','{chars} 文字 · {bytes} UTF-8 バイト','{chars}자 · UTF-8 {bytes}바이트'],
  scroll:['Scrollable results table','可左右滑动结果表格','横にスクロールできる比較表','가로로 스크롤할 수 있는 결과 표'],
  tokenizer:['Tokenizer','分词器','トークナイザー','토크나이저'],tokens:['Tokens','Token 数','トークン数','토큰 수'],minimum:['vs. minimum','相对最少','最小値との比率','최솟값 대비'],rate:['Your $/1M','自填单价 $/1M','入力単価 $/100万','입력 단가 $/100만'],cost:['Input USD','输入费用 USD','入力コスト USD','입력 비용 USD'],status:['Status','状态','状態','상태'],counted:['Counted','已计数','計数済み','계산 완료'],legacyStatus:['Legacy reference','旧版参考','旧版参考','구형 참고용'],unavailable:['Unavailable — retry','暂不可用，请重试','利用不可・再試行','사용 불가 — 재시도'],
  countNote:['Plain text only; no chat template or extra special tokens. Fewer tokens alone does not mean lower cost or better quality.','仅计算纯文本，不添加对话模板或额外特殊 token；token 少不代表更便宜或效果更好。','プレーンテキストのみ。対話テンプレートや特別なトークンは追加しません。トークン数が少なくても低料金・高品質とは限りません。','일반 텍스트만 계산하며 대화 템플릿이나 특수 토큰을 추가하지 않습니다. 토큰이 적다고 더 저렴하거나 품질이 좋은 것은 아닙니다.'],
  inspect:['INSIDE THE TOKENS','分词明细','トークンの内訳','토큰 상세'],allTokens:['All tokens shown.','已展示全部 token。','すべてのトークンを表示しています。','모든 토큰을 표시합니다.'],firstTokens:['First 200 tokens shown; the count includes the full input.','仅展示前 200 个 token，总数包含全文。','先頭 200 トークンを表示しています。合計は全文を含みます。','처음 200개 토큰만 표시하며 전체 입력을 합산한 수입니다.'],noTokens:['No tokenizer loaded. Compare again to retry.','分词器加载失败，请重试。','トークナイザーを読み込めませんでした。再度比較してください。','토크나이저를 불러오지 못했습니다. 다시 비교하세요.'],
  piecesNote:['Decoded text where possible. Native markers or IDs represent incomplete Unicode fragments. Hover for IDs; pieces may not reproduce original spacing.','尽可能显示可读文本；不完整 Unicode 片段保留原始标记或 ID。悬停查看 ID，片段不一定还原原始空格。','可能な限り文字に復元します。不完全な Unicode は元の記号や ID で表示します。ホバーで ID を確認できます。元の空白を再現しない場合があります。','가능한 경우 읽을 수 있는 문자로 표시합니다. 불완전한 유니코드 조각은 원래 표식이나 ID로 표시합니다. 마우스를 올리면 ID를 볼 수 있으며 원래 공백과 다를 수 있습니다.'],
  ids:['Token IDs & source','Token ID 与来源','トークン ID と出典','토큰 ID 및 출처'],source:['View tokenizer source ↗','查看分词器来源 ↗','トークナイザーの出典を見る ↗','토크나이저 출처 보기 ↗'],
  next:['YOUR NEXT API CALL','接入你的下一次 API 调用','次の API 呼び出しへ','다음 API 호출을 준비하세요'],ctaTitle:['Compare here. Build with CrazyRouter.','在这里对比，用 CrazyRouter 接入。','ここで比較。CrazyRouter で開発。','여기서 비교하고 CrazyRouter로 개발하세요.'],ctaText:['Compare model pricing and get an API key to connect the right model to your app.','查看模型价格，获取 API Key，把合适的模型接入你的应用。','モデル料金を比較し、API キーを取得して、用途に合うモデルをアプリに接続しましょう。','모델 가격을 비교하고 API 키를 발급받아 앱에 적합한 모델을 연결하세요.'],pricing:['View model pricing ↗','查看模型价格 ↗','モデル料金を見る ↗','모델 가격 보기 ↗'],signup:['Get an API key ↗','注册获取密钥 ↗','API キーを取得 ↗','API 키 발급받기 ↗'],
  accuracy:['How accurate is this?','结果有多准确？','結果はどの程度正確ですか？','결과는 얼마나 정확한가요?'],
  method:['Pinned public tokenizer data; each tokenizer applies its own normalization. Claude legacy uses NFKC. Kimi keeps its native special-marker handling and 25,000-character run splitting. No automatic padding, truncation or chat template is applied.','使用固定版本的公开分词数据，各分词器应用自身规范化规则。Claude 旧版使用 NFKC；Kimi 保留原生特殊标记识别和连续 25,000 字符切分规则。不自动填充、截断或添加对话模板。','固定バージョンの公開データと各分詞器の正規化を使用します。旧版 Claude は NFKC、Kimi は元の特殊マーカー処理と連続 25,000 文字の分割規則を使います。自動パディング・切り詰め・対話テンプレートは適用しません。','고정 버전의 공개 데이터와 각 토크나이저의 정규화 규칙을 사용합니다. 구형 Claude는 NFKC를 적용하며 Kimi는 원래의 특수 표식 처리와 연속 25,000자 분할 규칙을 유지합니다. 자동 패딩, 자르기, 대화 템플릿은 적용하지 않습니다.'],
  validation:['Token IDs are checked against Python reference implementations on multilingual, code, whitespace, special-marker and long-text samples. This finite check does not guarantee all inputs or API billing. Real requests may include system messages, history, tools and images. API usage is authoritative for billing.','已使用多语言、代码、空白、特殊标记和长文本样本，与 Python 参考实现核对 token ID。有限测试不保证所有输入或 API 计费一致。实际请求还可能包含系统提示、历史、工具和图片；计费以 API usage 为准。','多言語・コード・空白・特殊マーカー・長文で Python 参照実装とのトークン ID を確認しています。すべての入力や API 課金の一致を保証するものではありません。実際のリクエストにはシステムメッセージ、履歴、ツール、画像などが含まれます。課金は API の usage が基準です。','다국어, 코드, 공백, 특수 표식, 긴 텍스트로 Python 참조 구현과 토큰 ID를 대조합니다. 모든 입력이나 API 과금의 일치를 보장하지는 않습니다. 실제 요청에는 시스템 메시지, 대화 기록, 도구, 이미지 등이 포함될 수 있으며 과금은 API usage를 기준으로 합니다.'],
  formula:['Input cost = tokens × your USD rate per million ÷ 1,000,000.','输入费用 = token 数 × 自填美元单价 ÷ 1,000,000。','入力コスト = トークン数 × 100 万トークンあたりの米ドル単価 ÷ 1,000,000。','입력 비용 = 토큰 수 × 100만 토큰당 USD 단가 ÷ 1,000,000.'],
  privacyDetail:['Prompts are neither saved nor uploaded. Language preference may be saved locally. Static assets are hosted on Hugging Face and subject to its hosting policies.','不保存或上传输入文本。语言偏好可能保存在本地。静态资源由 Hugging Face 托管，适用其托管政策。','入力テキストは保存・送信しません。言語設定は端末に保存される場合があります。静的ファイルは Hugging Face の規約に基づき配信されます。','입력 텍스트는 저장하거나 업로드하지 않습니다. 언어 설정은 기기에 저장될 수 있습니다. 정적 파일은 Hugging Face에서 호스팅되며 해당 정책이 적용됩니다.'],
  built:['Built by','由','開発','제작'],powered:['Powered by Hugging Face Tokenizers.js & js-tiktoken','基于 Hugging Face Tokenizers.js 与 js-tiktoken','Hugging Face Tokenizers.js と js-tiktoken を使用','Hugging Face Tokenizers.js 및 js-tiktoken 기반'],versions:['Tokenizer versions','分词器版本','トークナイザーのバージョン','토크나이저 버전'],licenses:['Licenses','许可协议','ライセンス','라이선스'],
};
export function t(lang,key,vars={}) {
  const index=LANGUAGES.indexOf(lang);const template=copy[key]?.[index];
  if(template===undefined)throw new Error(`Missing translation: ${lang}.${key}`);
  return template.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??''));
}
export function initialLanguage(query,stored,browser) {
  const requested=new URLSearchParams(query).get('lang');
  if(LANGUAGES.includes(requested))return requested;
  if(LANGUAGES.includes(stored))return stored;
  const short=browser?.split('-')[0];return LANGUAGES.includes(short)?short:'en';
}
export const translationKeys=Object.keys(copy);
