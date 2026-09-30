import { Tokenizer } from '@huggingface/tokenizers';
import { Tiktoken } from 'js-tiktoken/lite';

export const SPECS = [
  {key:'qwen3', label:'Qwen3-8B', source:'Qwen/Qwen3-8B', revision:'b968826d9c46dd6066d109eabc6255188de91218'},
  {key:'deepseek_v3', label:'DeepSeek-V3', source:'deepseek-ai/DeepSeek-V3', revision:'e815299b0bcbac849fa540c768ef21845365c9eb'},
  {key:'mistral', label:'Mistral-7B-Instruct-v0.3', source:'mistralai/Mistral-7B-Instruct-v0.3', revision:'c170c708c41dac9275d15a8fff4eca08d52bab71'},
  {key:'o200k', label:'GPT · o200k_base', encoding:'o200k_base'},
  {key:'cl100k', label:'GPT · cl100k_base', encoding:'cl100k_base'},
  {key:'glm5', label:'GLM-5', source:'zai-org/GLM-5', revision:'c183ef8c61faee82855eca1ed9bb3a9a7ce3b0b2'},
  {key:'kimi25', label:'Kimi K2.5', source:'moonshotai/Kimi-K2.5', revision:'4d01dfe0332d63057c186e0b262165819efb6611', encoding:'kimi', custom:true},
  {key:'claude_legacy', label:'Claude · legacy', encoding:'claude', custom:true, legacy:true, revision:'@anthropic-ai/tokenizer 0.0.4', sourceUrl:'https://github.com/anthropics/anthropic-tokenizer-typescript'},
];
export const MAX_CHARS = 50000;
export function validateInput(text, keys, rates) {
  if (!text) throw new Error('errorEmpty');
  if ([...text].length > MAX_CHARS) throw new Error('errorLength');
  if (!keys.length || keys.some(key => !SPECS.some(s => s.key === key))) throw new Error('errorSelection');
  for (const key of keys) {
    const rate = rates[key];
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) throw new Error('errorRate');
  }
}
export function siteUrl(path, placement, model = '') {
  const host = globalThis.location?.hostname || '';
  const source = host.endsWith('.github.io') ? 'github' : host === 'crazyrouter.com' ? 'tools' : 'huggingface';
  const params = new URLSearchParams({utm_source:source,utm_medium:source==='github'?'github_pages':'tool',utm_campaign:'token_comparison',utm_content:placement});
  if (model) params.set('utm_term',model);
  return `https://crazyrouter.com${path}?${params}`;
}
export function createHF(data, config) {
  return new Tokenizer({...data, truncation:null, padding:null}, config);
}
export async function createGPT(key) {
  const ranks = key === 'o200k' ? await import('js-tiktoken/ranks/o200k_base') : await import('js-tiktoken/ranks/cl100k_base');
  return new Tiktoken(ranks.default);
}
export function createCustom(ranks) { return new Tiktoken(ranks); }
// Kimi's upstream wrapper limits runs of whitespace/non-whitespace to 25,000 code points.
export function kimiChunks(text) {
  const parts=[];let chunk='',run=0,previous=null;
  for(const char of text) {
    const space=/[\p{White_Space}\u001c-\u001f]/u.test(char);
    run=space===previous?run+1:1;previous=space;
    if(run>25000){parts.push(chunk);chunk='';run=1;}
    chunk+=char;
  }
  parts.push(chunk);return parts;
}
export function encode(tokenizer, spec, text) {
  if(spec.encoding==='claude')return tokenizer.encode(text.normalize('NFKC'),'all');
  if(spec.encoding==='kimi')return kimiChunks(text).flatMap(chunk=>tokenizer.encode(chunk,'all'));
  return spec.encoding ? tokenizer.encode(text, [], []) : tokenizer.encode(text, {add_special_tokens:false}).ids;
}
export function resultFor(tokenizer, spec, text, rate) {
  const ids = encode(tokenizer,spec,text);
  const preview = ids.slice(0,200);
  const native = spec.encoding ? null : tokenizer.encode(text,{add_special_tokens:false}).tokens;
  const pieces = preview.map((id,i) => {
    const decoded = spec.encoding ? tokenizer.decode([id]) : tokenizer.decode([id],{skip_special_tokens:false, clean_up_tokenization_spaces:false});
    return decoded && !decoded.includes('\ufffd') ? decoded : native?.[i] ?? `[partial Unicode · ${id}]`;
  });
  return {key:spec.key, count:ids.length, ids:preview, pieces, rate, cost:rate === null ? null : ids.length * rate / 1000000, status:'ok'};
}
