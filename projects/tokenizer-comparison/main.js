import './style.css';
import {SPECS,validateInput,siteUrl} from './core.js';
import {t,initialLanguage} from './i18n.js';
const $=id=>document.getElementById(id);
const samples={zh:'人工智能让开发更简单。用同一个 API，连接不同的大语言模型。',en:'Build once. Compare models. Choose the right API for your application.',ja:'人工知能で開発をもっと簡単に。同じ API でさまざまな言語モデルを利用できます。',ko:'인공지능으로 개발을 더 쉽게. 하나의 API로 다양한 언어 모델을 연결하세요.',code:'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("世界 🌍"))',mixed:'用户 user_id=1024，日本語、한국어、English 👋\n{"status":"ok","message":"你好 / こんにちは / 안녕하세요"}'};
let stored;try{stored=localStorage.getItem('tokenizer-language');}catch{}
let language=initialLanguage(location.search,stored,navigator.language);
let worker=null,job=0,rows=[],timer,statusKey='ready',statusVars={},partial=false,snapshot='';
const tr=(key,vars)=>t(language,key,vars);
const label=spec=>spec.legacy?tr('legacyLabel'):spec.label;
function links(key='') {document.querySelectorAll('[data-site]').forEach(a=>{a.href=siteUrl(a.dataset.site,a.dataset.placement,key);a.target='_blank';a.rel='noopener noreferrer';});}
function status(key,vars={},someFailed=false){statusKey=key;statusVars=vars;partial=someFailed;$('status').textContent=tr(key,vars)+(someFailed?' · '+tr('failedSome'):'');}
function stats(){if(snapshot)$('stats').textContent=tr('stats',{chars:[...snapshot].length.toLocaleString(language),bytes:new TextEncoder().encode(snapshot).length.toLocaleString(language)});}
links();
for(const spec of SPECS){
  const choice=document.createElement('label');choice.className='choice';
  const check=document.createElement('input');check.type='checkbox';check.value=spec.key;check.checked=true;check.name='tokenizer';
  const name=document.createElement('span');name.dataset.modelLabel=spec.key;name.textContent=label(spec);choice.append(check,name);$('choices').append(choice);
  const rateLabel=document.createElement('label');const caption=document.createElement('span');caption.dataset.rateLabel=spec.key;caption.textContent=label(spec)+' · $/1M';
  const input=document.createElement('input');input.type='number';input.min='0';input.step='any';input.placeholder='—';input.id=`rate-${spec.key}`;rateLabel.append(caption,input);$('rates').append(rateLabel);
}
function applyLanguage(){
  document.documentElement.lang=language;document.title=tr('pageTitle');document.querySelector('meta[name="description"]').content=tr('description');
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',tr(el.dataset.i18nAria)));
  document.querySelectorAll('[data-model-label]').forEach(el=>{el.textContent=label(SPECS.find(s=>s.key===el.dataset.modelLabel));});
  document.querySelectorAll('[data-rate-label]').forEach(el=>{el.textContent=label(SPECS.find(s=>s.key===el.dataset.rateLabel))+' · $/1M';});
  $('prompt').placeholder=tr('placeholder');$('language').value=language;stats();status(statusKey,statusVars,partial);if(rows.length)render(rows);
}
$('language').addEventListener('change',()=>{
  language=$('language').value;try{localStorage.setItem('tokenizer-language',language);}catch{}
  const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);applyLanguage();
});
function stop(){job++;clearTimeout(timer);if(worker){worker.terminate();worker=null;}$('compare').disabled=false;$('cancel').hidden=true;}
function clearResults(){rows=[];snapshot='';$('rows').replaceChildren();$('pieces').replaceChildren();$('ids').textContent='';$('results').hidden=true;$('legacy-result').hidden=true;links();}
function edited(){if($('compare').disabled)stop();else job++;clearResults();$('char-count').textContent=`${[...$('prompt').value].length.toLocaleString(language)} / 50,000`;status('edited');}
$('prompt').addEventListener('input',edited);$('choices').addEventListener('change',edited);$('rates').addEventListener('input',edited);
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{$('prompt').value=samples[button.dataset.example];edited();}));
$('clear').addEventListener('click',()=>{$('prompt').value='';edited();$('prompt').focus();});
$('cancel').addEventListener('click',()=>{stop();clearResults();status('cancelled');});
function inspect(){
  const row=rows.find(r=>r.key===$('inspect').value);$('pieces').replaceChildren();$('ids').textContent='';if(!row)return;
  links(row.key);const spec=SPECS.find(s=>s.key===row.key);$('legacy-result').hidden=!spec.legacy;
  $('preview-note').textContent=tr(row.count>200?'firstTokens':'allTokens');
  row.pieces.forEach((piece,index)=>{const span=document.createElement('span');span.className='token';span.textContent=piece;span.title=`Token ID: ${row.ids[index]}`;$('pieces').append(span);});
  $('ids').textContent=JSON.stringify({tokenizer:label(spec),source:spec.source||spec.sourceUrl||spec.encoding,revision:spec.revision||'js-tiktoken 1.0.21',legacy_only:Boolean(spec.legacy),count:row.count,preview_truncated:row.count>200,token_ids:row.ids},null,2);
  $('source').href=spec.sourceUrl||(spec.source?`https://huggingface.co/${spec.source}/tree/${spec.revision}`:'https://github.com/openai/tiktoken');
}
$('inspect').addEventListener('change',inspect);
function render(next){
  rows=next;$('results').hidden=false;$('rows').replaceChildren();
  const counts=rows.filter(r=>r.status==='ok').map(r=>r.count);const min=counts.length?Math.min(...counts):0;
  for(const row of rows){
    const spec=SPECS.find(s=>s.key===row.key);const line=document.createElement('tr');line.dataset.key=row.key;if(row.status==='ok'&&row.count===min)line.className='minimum';
    let state='unavailable';if(row.status==='ok')state=spec.legacy?'legacyStatus':'counted';
    const values=[label(spec),row.count??'—',row.status==='ok'&&min?`${(row.count/min).toFixed(2)}×`:'—',row.rate===null?'—':`$${row.rate}`,row.cost===null?'—':`$${row.cost.toFixed(8)}`,tr(state)];
    values.forEach((value,index)=>{const td=document.createElement('td');td.textContent=value;if(index===1)td.className='count';if(index===5)td.className='row-status';line.append(td);});$('rows').append(line);
  }
  const previous=$('inspect').value;$('inspect').replaceChildren();rows.filter(r=>r.status==='ok').forEach(r=>{const option=document.createElement('option');option.value=r.key;option.textContent=label(SPECS.find(s=>s.key===r.key));$('inspect').append(option);});
  if(rows.some(r=>r.key===previous&&r.status==='ok'))$('inspect').value=previous;
  $('inspect').disabled=!counts.length;$('source').hidden=!counts.length;
  if(!counts.length){$('preview-note').textContent=tr('noTokens');$('pieces').replaceChildren();$('ids').textContent='';$('legacy-result').hidden=true;}else inspect();
}
$('compare').addEventListener('click',()=>{
  const text=$('prompt').value;const keys=[...document.querySelectorAll('input[name="tokenizer"]:checked')].map(el=>el.value);
  const rates=Object.fromEntries(SPECS.map(s=>[s.key,$(`rate-${s.key}`).value===''?null:Number($(`rate-${s.key}`).value)]));
  clearResults();try{validateInput(text,keys,rates);}catch(error){status(error.message);return;}
  const id=++job;$('compare').disabled=true;$('cancel').hidden=false;snapshot=text;stats();status('loading');
  function failed(key){stop();clearResults();status(key);}
  if(!worker){try{worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});}catch{failed('errorWorker');return;}}
  worker.onmessage=({data})=>{
    if(data.id!==job)return;
    if(data.type==='progress')status('progress',{model:data.label});
    if(data.type==='rows'||data.type==='done')render(data.rows);
    if(data.type==='done'){clearTimeout(timer);$('compare').disabled=false;$('cancel').hidden=true;const good=rows.filter(r=>r.status==='ok').length;status('done',{good,total:keys.length},good<keys.length);}
    if(data.type==='error')failed(data.message);
  };
  worker.onerror=()=>failed('errorWorker');timer=setTimeout(()=>failed('errorTimeout'),180000);worker.postMessage({id,text,keys,rates});
});
applyLanguage();
