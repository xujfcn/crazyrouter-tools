import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteUrl} from '../core.js';
test('deployment attribution identifies GitHub, Hugging Face and main site without input data',()=>{
  const original=globalThis.location;
  try {
    for(const [hostname,source,medium] of [['xujfcn.github.io','github','github_pages'],['xujfcn-crazyrouter-tokenizer-comparison.static.hf.space','huggingface','tool'],['crazyrouter.com','tools','tool']]) {
      globalThis.location={hostname,search:'?prompt=private-text&token=secret'};
      const url=new URL(siteUrl('/register','results_register','kimi25'));
      assert.equal(url.searchParams.get('utm_source'),source);
      assert.equal(url.searchParams.get('utm_medium'),medium);
      assert.equal(url.searchParams.get('utm_term'),'kimi25');
      assert.equal(url.searchParams.size,5);
      assert.ok(!url.href.includes('private-text'));
    }
  } finally {if(original===undefined)delete globalThis.location;else globalThis.location=original;}
});
