import {SPECS, createHF, createGPT, createCustom, resultFor, validateInput} from './core.js';
const cache = new Map();
const dataBase = new URL('../tokenizers/', import.meta.url).href;
async function readJson(url) {
  const response = await fetch(url, {signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error('Download failed');
  return response.json();
}
async function load(spec) {
  if (!cache.has(spec.key)) {
    let promise;
    if(spec.custom) promise=readJson(`${dataBase}${spec.key}/ranks.json`).then(createCustom);
    else if(spec.encoding) promise=createGPT(spec.key);
    else promise=Promise.all([
      readJson(`${dataBase}${spec.key}/tokenizer.json`),
      readJson(`${dataBase}${spec.key}/tokenizer_config.json`),
    ]).then(([data,config]) => createHF(data,config));
    cache.set(spec.key,promise);
    promise.catch(() => cache.delete(spec.key));
  }
  return cache.get(spec.key);
}
self.onmessage = async ({data}) => {
  const {id,text,keys,rates} = data;
  try {
    validateInput(text,keys,rates);
    const rows=[];
    for (const key of keys) {
      const spec=SPECS.find(s=>s.key===key);
      self.postMessage({id,type:'progress',label:spec.label});
      try { rows.push(resultFor(await load(spec),spec,text,rates[key])); }
      catch { rows.push({key,status:'unavailable',count:null,ids:[],pieces:[],rate:rates[key],cost:null}); }
      self.postMessage({id,type:'rows',rows});
    }
    self.postMessage({id,type:'done',rows});
  } catch (error) { self.postMessage({id,type:'error',message:error.message}); }
};
