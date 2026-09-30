const $=id=>document.getElementById(id);
const zh=document.documentElement.lang.startsWith('zh');
const tr=(en,cn)=>zh?cn:en;
let snapshot;
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:6});
const providers=[['crazyrouter','CrazyRouter'],['official',tr('Official','官方')],['azure','Azure'],['bedrock','AWS Bedrock'],['vertex','Google Vertex AI'],['openrouter','OpenRouter']];
try {
  const response=await fetch('./pricing.json');
  if(!response.ok)throw new Error('download failed');
  snapshot=await response.json();
  if(!Array.isArray(snapshot.models)||!snapshot.models.length)throw new Error('empty snapshot');
  $('snapshot').textContent=tr(`Snapshot: ${snapshot.generatedAt}. Planning estimates, not live quotes.`,`价格快照：${snapshot.generatedAt}。用于预算估算，不是实时报价。`);
  for(const row of snapshot.models){const option=document.createElement('option');option.value=row.model;option.textContent=row.model;$('model').append(option);}
}catch(error){$('status').textContent=tr('Could not load pricing data. Reload to try again.','无法加载价格数据，请刷新重试。');}
$('calculator').addEventListener('input',()=>{$('results').hidden=true;$('status').textContent='';});
$('calculator').addEventListener('submit',event=>{
  event.preventDefault();$('results').hidden=true;
  const inputs=['requests','input','output'].map(id=>$(id).value===''?NaN:Number($(id).value));
  if(!snapshot||inputs.some(v=>!Number.isSafeInteger(v)||v<0)||inputs[0]<1){$('status').textContent=tr('Enter whole, non-negative token counts and at least one request.','请填写非负整数 Token 数，请求次数至少为 1。');return;}
  const model=snapshot.models.find(row=>row.model===$('model').value);
  const [requests,input,output]=inputs;
  $('rows').replaceChildren();
  for(const [key,label] of providers){
    const rate=model[key];if(!rate)continue;
    const available=typeof rate.input==='number'&&Number.isFinite(rate.input)&&rate.input>=0&&typeof rate.output==='number'&&Number.isFinite(rate.output)&&rate.output>=0;
    const cost=available?requests*(input*rate.input+output*rate.output)/1e6:null;
    const row=document.createElement('tr');row.dataset.provider=key;
    for(const text of [label,typeof rate.input==='number'?money.format(rate.input):tr('Unavailable','不可用'),typeof rate.output==='number'?money.format(rate.output):tr('Unavailable','不可用'),cost!==null&&Number.isFinite(cost)?money.format(cost):tr('Unavailable','不可用')]){const td=document.createElement('td');td.textContent=text;row.append(td);}
    const td=document.createElement('td');const link=document.createElement('a');
    const href=key==='crazyrouter'?'https://crazyrouter.com/models?utm_source=github&utm_medium=github_pages&utm_campaign=pricing-calculator&utm_content=row_source':rate.url;
    if(href&&/^https:\/\//.test(href)){link.href=href;link.textContent=tr('Verify rate ↗','核对单价 ↗');link.rel='noopener noreferrer';link.target='_blank';td.append(link);}else td.textContent=tr('See dataset','查看数据集');
    row.append(td);$('rows').append(row);
  }
  $('status').textContent=tr('Estimate = requests × (input tokens × input rate + output tokens × output rate) / 1,000,000.','估算费用 = 请求次数 ×（输入 Token × 输入单价 + 输出 Token × 输出单价）÷ 1,000,000。');
  $('results').hidden=false;
});
