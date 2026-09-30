import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SPECS,createHF,createGPT,createCustom,encode,siteUrl,validateInput,resultFor,kimiChunks} from '../core.js';
const read = async path => JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const fixtures = await read('./reference.json');
for (const spec of SPECS) {
  test(`${spec.label}: exact token IDs match Python on ${fixtures.length} inputs`,async()=>{
    let tokenizer;
    if(spec.custom)tokenizer=createCustom(await read(`../public/tokenizers/${spec.key}/ranks.json`));
    else if(spec.encoding)tokenizer=await createGPT(spec.key);
    else tokenizer=createHF(await read(`../public/tokenizers/${spec.key}/tokenizer.json`),await read(`../public/tokenizers/${spec.key}/tokenizer_config.json`));
    for (const fixture of fixtures) assert.deepEqual(encode(tokenizer,spec,fixture.text),fixture.ids[spec.key],fixture.text.slice(0,60));
    const result=resultFor(tokenizer,spec,'你好 🌍 '.repeat(1000),null);
    assert.equal(result.ids.length,200);
    assert.equal(result.cost,null);
    assert.equal(resultFor(tokenizer,spec,'hello',0).cost,0);
    const paid=resultFor(tokenizer,spec,'hello',2.5);
    assert.equal(paid.cost,paid.count*2.5/1000000);
  });
}
test('Validation and attribution',()=>{
  assert.throws(()=>validateInput('', ['qwen3'],{qwen3:null}));
  assert.throws(()=>validateInput('x', ['qwen3'],{qwen3:NaN}));
  assert.throws(()=>validateInput('x'.repeat(50001), ['qwen3'],{qwen3:null}));
  assert.throws(()=>validateInput('x', [],{}));
  validateInput(' \n', ['qwen3'],{qwen3:null});
  assert.equal(new URL(siteUrl('/register','result','qwen3')).searchParams.get('utm_source'),'huggingface');
});
test('Kimi run splitting preserves Unicode code points and Python whitespace rules',()=>{
  assert.deepEqual(kimiChunks('a'.repeat(25001)),['a'.repeat(25000),'a']);
  assert.deepEqual(kimiChunks(' '.repeat(25001)),[' '.repeat(25000),' ']);
  assert.deepEqual(kimiChunks('🌍'.repeat(25001)),['🌍'.repeat(25000),'🌍']);
  assert.deepEqual(kimiChunks('a'.repeat(25000)+' '+'b'.repeat(25000)),['a'.repeat(25000)+' '+'b'.repeat(25000)]);
});
test('Claude matches the official Anthropic package, including normalization and special tokens',async()=>{
  const {getTokenizer,countTokens}=await import('@anthropic-ai/tokenizer');
  const native=getTokenizer();
  try{
    const tokenizer=createCustom(await read('../public/tokenizers/claude_legacy/ranks.json'));
    const spec=SPECS.find(s=>s.key==='claude_legacy');
    for(const fixture of fixtures.slice(0,23)){
      const actual=encode(tokenizer,spec,fixture.text);
      assert.deepEqual(actual,Array.from(native.encode(fixture.text.normalize('NFKC'),'all')));
      assert.equal(actual.length,countTokens(fixture.text));
    }
  }finally{native.free();}
});
