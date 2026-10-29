import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../workers/crazyrouter-tools.js', import.meta.url), 'utf8');
const requests = [];
let upstreamStatus = 200;
const sandbox = vm.createContext({
  URL, Response,
  addEventListener() {},
  fetch: async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response('upstream content', { status: upstreamStatus, headers: { 'Content-Type': 'text/html' } });
  },
});
vm.runInContext(source, sandbox);
const request = async path => {
  requests.length = 0;
  sandbox.input = new Request('https://crazyrouter.com/tools/' + path);
  return vm.runInContext('handleRequest(input)', sandbox);
};

let checks = 0;
for (const locale of ['', 'zh/', 'zh-TW/', 'es/', 'ja/', 'ru/']) {
  for (const suffix of ['', '/', '/index.html', '/?view=list', '/?utm_source=test']) {
    const response = await request(locale + 'model-timeline' + suffix);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'upstream content');
    assert.match(response.headers.get('Cache-Control'), /no-cache/);
    assert.equal(requests[0].url, 'https://xujfcn.github.io/crazyrouter-tools/' + locale + 'model-timeline/index.html');
    assert.equal(requests[0].options.cf.cacheTtl, -1);
    checks++;
  }
}
for (const version of ['old-build', 'new-build']) {
  const response = await request('model-timeline/timeline.js?v=' + version + '&utm_source=test');
  assert.equal(requests[0].url, 'https://xujfcn.github.io/crazyrouter-tools/model-timeline/timeline.js?v=' + version);
  assert.match(response.headers.get('Cache-Control'), /max-age=86400/);
  checks++;
}
for (const resource of ['timeline.js', 'timeline.css', 'releases.json']) {
  const response = await request('model-timeline/' + resource);
  assert.match(response.headers.get('Cache-Control'), /no-cache/);
  checks++;
}
const comparison = await request('zh/model-comparison/');
assert.equal(comparison.headers.get('Cache-Control'), 'public, max-age=3600');
assert.equal(requests[0].options.cf, undefined);
const retired = await request('zh/pricing-calculator/');
assert.equal(retired.status, 410);
assert.equal(requests.length, 0);
upstreamStatus = 404;
const fallback = await request('unknown-tool/');
assert.equal(fallback.status, 404);
assert.equal(requests[1].url, 'https://xujfcn.github.io/crazyrouter-tools/index.html');
console.log(JSON.stringify({ passed: true, checks: checks + 3 }));
