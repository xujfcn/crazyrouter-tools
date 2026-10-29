"""Browser coverage for the full public catalogue and sourced release dates."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json,os
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('COMPARISON_TEST_OUTPUT',ROOT/'.test-output'))
OUT.mkdir(parents=True,exist_ok=True)
catalog=json.loads((ROOT/'model-comparison/catalog.json').read_text(encoding='utf-8'))
benchmark=json.loads((ROOT/'model-comparison/benchmark-snapshot.json').read_text(encoding='utf-8'))
locales=json.loads((ROOT/'model-comparison/locales.json').read_text(encoding='utf-8'))
source=json.loads((ROOT/'model-comparison/pricing-source.json').read_text(encoding='utf-8'))
models=catalog['models']
total=len(models)
assert {m['model_name'] for m in source['data']}=={m['modelId'] for m in models}
assert total==179
assert next(m for m in models if m['name']=='gpt-6-astra')['input'] is None
assert next(m for m in models if m['name']=='aigc-video-kling-3.0')['input'] is None
assert next(m for m in models if m['name']=='gpt-4.1-mini')['input']==0.32
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/tools/'):self.path=self.path[len('/tools'):]
        return super().do_GET()
    def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
errors,missing=[],[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    ctx.route('https://**',lambda r:r.abort())
    page=ctx.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status>=400 and r.url.startswith(base) else None)
    def logos(target):
        expect(target.locator('#tbody .provider-mark img')).to_have_count(total)
        assert target.locator('#tbody .provider-mark img').evaluate_all('(images)=>images.every(i=>i.complete && i.naturalWidth>0)')
    def sorted_cells(selector, numeric=True):
        values=page.locator(selector).evaluate_all('(cells)=>cells.map(c=>c.dataset.score ?? c.dataset.release ?? c.dataset.price)')
        valid=[v for v in values if v!='']
        assert all(v=='' for v in values[len(valid):])
        return [float(v) for v in valid] if numeric else valid
    page.goto(base+'/tools/model-comparison/',wait_until='networkidle')
    logos(page)
    dates=sorted_cells('#tbody [data-release]',False)
    assert dates==sorted(dates,reverse=True) and len(dates)==104
    for _ in range(2):
        page.locator('th[data-sort="releaseDate"] button').click()
        dates=sorted_cells('#tbody [data-release]',False)
        assert dates==sorted(dates,reverse=page.locator('th[data-sort="releaseDate"]').get_attribute('aria-sort')=='descending')
    for metric in ['gpqa','artificial_analysis_intelligence_index','mmlu_pro','livecodebench']:
        page.locator('#metricFilter').select_option(metric)
        for _ in range(2):
            page.locator('#scoreHeader button').click()
            values=sorted_cells('#tbody [data-score]')
            assert values==sorted(values,reverse=page.locator('#scoreHeader').get_attribute('aria-sort')=='descending')
        if metric=='artificial_analysis_intelligence_index':
            assert len(values)==17
            assert '%' not in page.locator('#tbody .benchmark-score').first.inner_text()
    page.locator('#metricFilter').select_option('gpqa')
    for key in ['input','output']:
        for _ in range(2):
            page.locator(f'th[data-sort="{key}"] button').click()
            idx=0 if key=='input' else 1
            vals=page.locator('#tbody tr').evaluate_all(f'(rows)=>rows.map(r=>r.querySelectorAll("[data-price]")[{idx}].dataset.price)')
            present=[float(v) for v in vals if v!='']
            assert all(v=='' for v in vals[len(present):])
            assert present==sorted(present,reverse=page.locator(f'th[data-sort="{key}"]').get_attribute('aria-sort')=='descending')
    for model in models:
        row=page.locator('#tbody tr').filter(has=page.locator('input[data-name="'+model['name']+'"]'))
        expect(row.locator('.release-cell')).to_contain_text(model['releaseDate'] or locales['en']['releasePending'])
        if model['name'] in benchmark['models']:
            expect(row.locator('.benchmark-variant')).to_have_attribute('href',benchmark['models'][model['name']]['url'])
    for kind in ['text','image','video','audio','embedding','3d']:
        page.locator('#categoryFilter').select_option(kind)
        expect(page.locator('#tbody tr')).to_have_count(sum(m['category']==kind for m in models))
    page.locator('#resetFilters').click()
    page.locator('#priceFilter').select_option('available')
    expect(page.locator('#tbody tr')).to_have_count(sum(m['input'] is not None for m in models))
    page.locator('#resetFilters').click()
    page.locator('#search').fill('missing-nonexistent-model')
    expect(page.locator('#emptyState')).to_be_visible()
    page.locator('#emptyReset').click()
    selected=['gpt-4.1-mini','claude-haiku-4-5','gemini-2.5-flash','gpt-6-astra']
    for name in selected:
        page.locator('#search').fill(name)
        page.get_by_role('checkbox',name='Select '+name,exact=True).check()
    page.locator('#resetFilters').click()
    expect(page.locator('#tbody input:disabled')).to_have_count(total-4)
    page.locator('#categoryFilter').select_option('video')
    page.locator('#compareButton').click()
    for value in ['Release date','AA Intelligence Index','MMLU-Pro','LiveCodeBench','2026-09-03','66.4%']:
        expect(page.locator('#comparisonTable')).to_contain_text(value)
    page.screenshot(path=str(OUT/'comparison-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(OUT/'comparison-mobile.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    for name in selected[:3]:page.get_by_role('button',name='Remove '+name,exact=True).click()
    expect(page.locator('#compareSection')).to_be_hidden()
    page.locator('#clearSelection').click()
    for lang,t in locales.items():
        page.goto(base+'/tools/'+('' if lang=='en' else lang+'/')+'model-comparison/',wait_until='networkidle')
        expect(page.locator('h1')).to_have_text(t['title'])
        logos(page)
        expect(page.locator('#tbody tr')).to_have_count(total)
        for width in [320,390,768,1440]:
            page.set_viewport_size({'width':width,'height':1000 if width>640 else 844})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(lang,width)
            for field in page.locator('.field input,.field select,.filters button').all():
                box=field.bounding_box()
                assert box and box['width']>20 and box['x']>=0 and box['x']+box['width']<=width+1,(lang,width,box)
            if lang in ['en','zh'] and width in [390,1440]:
                page.screenshot(path=str(OUT/f'after-{lang}-{width}.png'),full_page=True)
    nojs=browser.new_context(java_script_enabled=False)
    nojs.route('https://**',lambda r:r.abort())
    fallback=nojs.new_page()
    for lang in locales:
        fallback.goto(base+'/tools/'+('' if lang=='en' else lang+'/')+'model-comparison/',wait_until='networkidle')
        logos(fallback)
        expect(fallback.locator('#tbody')).to_contain_text('2026-09-03')
        expect(fallback.locator('#tbody')).to_contain_text('56.9')
        expect(fallback.locator('.filters')).to_be_hidden()
    browser.close()
server.shutdown()
report={'models':total,'releaseDates':len(dates),'locales':list(locales),'widths':[320,390,768,1440],'checks':['pricing-page set equality','null-last release/price/metric sorting','four metric scales','type and quote filtering','full source matching','cross-filter comparison','four-model limit','no-JS dates/logos','viewport containment'],'errors':errors,'missingAssets':missing}
(OUT/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
assert not errors and not missing
