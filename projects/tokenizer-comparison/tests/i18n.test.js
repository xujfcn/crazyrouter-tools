import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LANGUAGES,t,translationKeys,initialLanguage} from '../i18n.js';
test('Every rendered string has four complete translations',async()=>{
  for(const lang of LANGUAGES)for(const key of translationKeys)assert.ok(t(lang,key).trim(),`${lang}.${key}`);
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g))for(const lang of LANGUAGES)assert.ok(t(lang,match[1]));
  assert.equal(t('ja','done',{good:8,total:8}),'8/8 トークナイザー完了');
  assert.equal(t('ko','errorEmpty'),'먼저 텍스트를 입력하세요.');
});
test('Explicit language wins over stored and browser preferences',()=>{
  assert.equal(initialLanguage('?lang=ko','ja','en-US'),'ko');
  assert.equal(initialLanguage('?lang=xx','ja','en-US'),'ja');
  assert.equal(initialLanguage('',null,'ja-JP'),'ja');
  assert.equal(initialLanguage('',null,'ko-KR'),'ko');
  assert.equal(initialLanguage('',null,'fr-FR'),'en');
});
test('Legacy Claude is never labeled as a current model',()=>{
  for(const lang of LANGUAGES){assert.match(t(lang,'legacyNote'),/Claude 3/);assert.match(t(lang,'legacyNote'),/count_tokens/);}
});
