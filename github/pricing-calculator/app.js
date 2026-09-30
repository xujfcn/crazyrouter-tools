const $=id=>document.getElementById(id);
let snapshot;
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:6});
const providers=[['crazyrouter','CrazyRouter'],['official','Official'],['azure','Azure'],['bedrock','AWS Bedrock'],['vertex','Google Vertex AI'],['openrouter','OpenRouter']];
try {
  const response=await fetch('./pricing.json');
  if(!response.ok)throw new Error('download failed');
  snapshot=await response.json();
  if(!Array.isArray(snapshot.models)||!snapshot.models.length)throw new Error('empty snapshot');
  $('snapshot').textContent=`Snapshot: ${snapshot.generatedAt}. Planning estimates, not live quotes.`;
  for(const row of snapshot.models){const option=document.createElement('option');option.value=row.model;option.textContent=row.model;$('model').append(option);}
}catch(error){$('status').textContent='Could not load pricing data. Reload to try again.';}
$('calculator').addEventListener('input',()=>{$('results').hidden=true;$('status').textContent='';});
$('calculator').addEventListener('submit',event=>{
  event.preventDefault();$('results').hidden=true;
  const inputs=['requests','input','output'].map(id=>$(id).value===''?NaN:Number($(id).value));
  if(!snapshot||inputs.some(v=>!Number.isSafeInteger(v)||v<0)||inputs[0]<1){$('status').textContent='Enter whole, non-negative token counts and at least one request.';return;}
  const model=snapshot.models.find(row=>row.model===$('model').value);
  const [requests,input,output]=inputs;
  $('rows').replaceChildren();
  for(const [key,label] of providers){
    const rate=model[key];if(!rate)continue;
    const available=typeof rate.input==='number'&&Number.isFinite(rate.input)&&rate.input>=0&&typeof rate.output==='number'&&Number.isFinite(rate.output)&&rate.output>=0;
    const cost=available?requests*(input*rate.input+output*rate.output)/1e6:null;
    const tr=document.createElement('tr');tr.dataset.provider=key;
    for(const text of [label,typeof rate.input==='number'?money.format(rate.input):'Unavailable',typeof rate.output==='number'?money.format(rate.output):'Unavailable',cost!==null&&Number.isFinite(cost)?money.format(cost):'Unavailable']){const td=document.createElement('td');td.textContent=text;tr.append(td);}
    const td=document.createElement('td');const link=document.createElement('a');
    const href=key==='crazyrouter'?'https://crazyrouter.com/models?utm_source=github&utm_medium=github_pages&utm_campaign=pricing-calculator&utm_content=row_source':rate.url;
    if(href&&/^https:\/\//.test(href)){link.href=href;link.textContent='Verify rate ↗';link.rel='noopener noreferrer';link.target='_blank';td.append(link);}else td.textContent='See dataset';
    tr.append(td);$('rows').append(tr);
  }
  $('status').textContent='Estimate = requests × (input tokens × input rate + output tokens × output rate) / 1,000,000.';
  $('results').hidden=false;
});
