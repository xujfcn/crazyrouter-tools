"""Browser regression checks for the model comparison tool (no paid API calls)."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json, os
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('COMPARISON_TEST_OUTPUT', ROOT / '.test-output'))
OUT.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT/'model-comparison/catalog.json').read_text(encoding='utf-8'))
locales = json.loads((ROOT/'model-comparison/locales.json').read_text(encoding='utf-8'))
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/tools/'):
            self.path = self.path[len('/tools'):]
        return super().do_GET()
    def log_message(self, *_): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
errors, missing = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    context.route('https://**', lambda route: route.abort())
    page = context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:missing.append(r.url) if r.status>=400 and r.url.startswith(base) else None)
    page.goto(base+'/tools/model-comparison/',wait_until='networkidle')
    expect(page.locator('#tbody tr')).to_have_count(len(catalog['models']))
    # Null prices must stay after all numeric prices for either sort direction.
    for key, index in [('input',0),('output',1)]:
        for _ in range(2):
            page.locator(f'th[data-sort="{key}"] button').press('Enter')
            values = page.locator('#tbody tr').evaluate_all(f'(rows)=>rows.map(row=>row.querySelectorAll("td[data-price]")[{index}].dataset.price)')
            first_missing=next(i for i,value in enumerate(values) if value=='')
            assert first_missing==17
            assert all(value=='' for value in values[first_missing:])
            numbers=[float(value) for value in values[:first_missing]]
            direction=page.locator(f'th[data-sort="{key}"]').get_attribute('aria-sort')
            assert numbers==sorted(numbers,reverse=direction=='descending')
    page.locator('#priceFilter').select_option('available')
    expect(page.locator('#tbody tr')).to_have_count(17)
    page.locator('#priceFilter').select_option('missing')
    expect(page.locator('#tbody tr')).to_have_count(22)
    page.locator('#resetFilters').click()
    page.locator('#search').fill('  GPT-4.1 mini  ')
    expect(page.locator('#tbody tr')).to_have_count(1)
    page.locator('#providerFilter').select_option('anthropic')
    expect(page.locator('#emptyState')).to_be_visible()
    page.locator('#emptyReset').click()
    expect(page.locator('#tbody tr')).to_have_count(39)
    names=['GPT-4.1 mini','Claude Haiku 4.5','Gemini 2.5 Flash','QwQ-32B']
    for index,name in enumerate(names):
        page.locator('#search').fill(name)
        page.get_by_role('checkbox',name=f'Select {name}',exact=True).check()
        if index==0: expect(page.locator('#compareButton')).to_be_disabled()
    page.locator('#resetFilters').click()
    expect(page.locator('#tbody input:checked')).to_have_count(4)
    expect(page.locator('#tbody input:disabled')).to_have_count(35)
    page.locator('#providerFilter').select_option('meta')
    page.locator('#compareButton').click()
    expect(page.locator('#compareSection')).to_be_visible()
    expect(page.locator('#comparisonTable thead th')).to_have_count(5)
    for name in names: expect(page.locator('#comparisonTable')).to_contain_text(name)
    page.screenshot(path=str(OUT/'comparison-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(OUT/'comparison-mobile.png'),full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'comparison viewport overflow'
    for name in names[:3]: page.get_by_role('button',name=f'Remove {name}',exact=True).click()
    expect(page.locator('#compareSection')).to_be_hidden()
    expect(page.locator('#compareButton')).to_be_disabled()
    page.locator('#clearSelection').click()
    expect(page.locator('#selectionDock')).to_be_hidden()
    page.locator('#resetFilters').click()
    for lang,translation in locales.items():
        url=base+'/tools/'+('' if lang=='en' else lang+'/')+'model-comparison/'
        page.goto(url,wait_until='networkidle')
        expect(page.locator('h1')).to_have_text(translation['title'])
        expect(page.locator('#tbody tr')).to_have_count(39)
        expect(page.locator('#resultsCount')).to_contain_text('39')
        for width in [320,390,768,1440]:
            page.set_viewport_size({'width':width,'height':1000 if width>640 else 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (lang,width,'overflow')
            for button in page.locator('.filters button,.field input,.field select').all():
                box=button.bounding_box()
                assert box and box['width']>20 and box['x']>=0 and box['x']+box['width']<=width+1,(lang,width,box)
            if lang in ['en','zh'] and width in [390,1440]:
                page.screenshot(path=str(OUT/f'after-{lang}-{width}.png'),full_page=True)
        page.locator('#search').fill('GPT-4.1 mini')
        page.get_by_role('checkbox').check()
        page.set_viewport_size({'width':320,'height':844})
        dock=page.locator('#selectionDock').bounding_box()
        assert dock['x']>=0 and dock['x']+dock['width']<=320
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    nojs.route('https://**',lambda route:route.abort())
    fallback=nojs.new_page()
    fallback.goto(base+'/tools/model-comparison/')
    expect(fallback.locator('#tbody tr')).to_have_count(39)
    expect(fallback.locator('#tbody')).to_contain_text('$0.065')
    expect(fallback.locator('.filters')).to_be_hidden()
    expect(fallback.locator('.noscript-note')).to_be_visible()
    browser.close()
server.shutdown()
report={'models':39,'snapshotPrices':17,'locales':list(locales),'widths':[320,390,768,1440],'checks':['null-safe sorting','keyboard sorting','search trimming','provider and price filters','empty reset','cross-filter comparison','four-model limit','remove and clear selection','no JavaScript fallback','viewport containment'],'pageErrors':errors,'missingLocalAssets':missing}
(OUT/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
assert not errors and not missing,(errors,missing)
