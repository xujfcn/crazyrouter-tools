"""Check release evidence, filters, chart interaction and responsive fallbacks.

Requires Playwright/Chromium. TIMELINE_TEST_OUTPUT controls screenshot location.
TIMELINE_BASE_URL can target a deployed /tools base instead of a local server.
"""
from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import json
import os
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('TIMELINE_TEST_OUTPUT',ROOT/'test-output/timeline'))
OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'model-timeline/releases.json').read_text(encoding='utf-8'))
events=data['events']
as_of=data['asOf']
assert len(events)==len({e['id'] for e in events})
assert events[0]['date']=='2026-10-29' and events[0]['name']=='Mistral Large 4'
by_id={e['id']:e for e in events}
expected_dates={'claude-3-haiku':'2024-03-13','grok-4':'2025-07-09','llama-4-scout':'2025-04-05','gpt-6-1-terra':'2026-10-26','deepseek-v4-1-flash-1017':'2026-10-17','gemini-4-argon-ga':'2026-10-13'}
for key,day in expected_dates.items(): assert by_id[key]['date']==day,key
for e in events:
    date.fromisoformat(e['date'] if e['precision']=='day' else e['date']+'-01')
    assert e['date']<=as_of,e['id']
    assert e['source']['kind'] in ('official','dataset') and e['source']['url'].startswith('https://')
    assert e['source']['checkedAt']<=as_of
    assert (ROOT/'model-timeline'/data['providers'][e['provider']]['logo']).is_file()
for lang in ('','zh/','es/','zh-TW/','ja/','ru/'):
    soup=BeautifulSoup((ROOT/lang/'model-timeline/index.html').read_text(encoding='utf-8'),'html.parser')
    assert len(soup.select('.release-row'))==len(events),lang
    assert len(soup.select('link[hreflang]'))==7
    assert len(soup.select('h1'))==1
    assert '2026-10-11' not in soup.select_one('head').get_text()
    assert {e['id'] for e in events}=={r['data-id'] for r in soup.select('.release-row')}
    for e in events:
        row=soup.find(id='release-'+e['id'])
        assert row.select_one('time')['datetime']==e['date']
        assert row.select_one('.release-source a')['href']==e['source']['url']

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/tools/'): self.path=self.path[len('/tools'):]
        super().do_GET()
    def log_message(self,*args): pass
server=None
base=os.environ.get('TIMELINE_BASE_URL')
if not base:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/tools'
origin=urlsplit(base).netloc
errors=[]
report=[]
recent={e['id'] for e in events if e['date']>='2026-08'}
def ids(page): return set(page.locator('#releaseList .release-row').evaluate_all('(rows)=>rows.map(r=>r.dataset.id)'))
def assert_width(page,width):
    assert page.evaluate('document.documentElement.scrollWidth')<=width+1,(width,page.evaluate('document.documentElement.scrollWidth'))
def check_chart(page):
    # Same-provider labels must never overlap, even for same-day releases.
    collisions=page.locator('.chart-track').evaluate_all('''tracks=>tracks.flatMap(track=>{
      const rects=[...track.querySelectorAll('.chart-event')].map(el=>({id:el.dataset.id,r:el.getBoundingClientRect()}));
      const errors=[];
      for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        if(a.r.left<b.r.right&&b.r.left<a.r.right&&a.r.top<b.r.bottom&&b.r.top<a.r.bottom)errors.push([a.id,b.id]);
      }
      return errors;
    })''')
    assert not collisions,collisions

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    # Only page assets are needed for these checks, not analytics or external sources.
    context.route('**/*',lambda route: route.continue_() if urlsplit(route.request.url).netloc==origin else route.abort())
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    for lang in ('','zh/','es/','zh-TW/','ja/','ru/'):
        page.goto(f'{base}/{lang}model-timeline/',wait_until='networkidle')
        expect(page.locator('html')).to_have_class('enhanced')
        assert ids(page)==recent,lang
        assert page.locator('img').evaluate_all('(xs)=>xs.every(i=>i.complete&&i.naturalWidth>0)'),lang
        for width in (1440,768,390,320):
            page.set_viewport_size({'width':width,'height':1000 if width>760 else 844})
            assert_width(page,width)
        report.append({'locale':lang or 'en','defaultRecords':len(recent),'responsiveWidths':[320,390,768,1440]})
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(base+'/zh/model-timeline/',wait_until='networkidle')
    page.screenshot(path=str(OUT/'after-desktop-zh.png'),animations='disabled')
    page.locator('#period').select_option('all')
    assert len(ids(page))==len(events)
    page.locator('#search').fill('gpt-6.1-terra')
    assert ids(page)=={'gpt-6-1-terra'}
    assert 'search=' in page.url
    page.reload(wait_until='networkidle')
    assert ids(page)=={'gpt-6-1-terra'}
    page.locator('#reset').click()
    page.locator('#provider').select_option('google')
    page.locator('#source').select_option('official')
    assert ids(page)=={e['id'] for e in events if e['id'] in recent and e['provider']=='google' and e['source']['kind']=='official'}
    page.locator('#category').select_option('image')
    assert ids(page)=={'nano-banana-2.1'}
    page.locator('#search').fill('zz-no-such-model-zz')
    expect(page.locator('#emptyState')).to_be_visible()
    page.locator('#emptyReset').click()
    expect(page.locator('#search')).to_be_focused()
    assert ids(page)==recent
    page.locator('#period').select_option('2025')
    assert ids(page)=={e['id'] for e in events if e['date'].startswith('2025')}
    page.locator('#sort').select_option('oldest')
    dates=page.locator('#releaseList .release-date time').evaluate_all('(ts)=>ts.map(t=>t.dateTime)')
    assert dates==sorted(dates)
    page.locator('#reset').click()
    page.locator('#timelineView').click()
    expect(page.locator('#timelinePanel')).to_be_visible()
    assert page.locator('.chart-event').count()==len(recent)
    check_chart(page)
    assert page.locator('#chartScroll').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    page.screenshot(path=str(OUT/'after-chart-zh.png'),animations='disabled')
    page.locator('#zoomIn').click()
    assert page.locator('#chartScroll').evaluate('(e)=>e.scrollWidth>e.clientWidth')
    check_chart(page)
    page.locator('#fit').click()
    assert page.locator('#chartScroll').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    first=page.locator('.chart-event').first
    first.focus();page.keyboard.press('Enter')
    expect(page.locator('#releaseDialog')).to_be_visible()
    assert page.locator('#detailBody .release-source a').get_attribute('href').startswith('https://')
    page.keyboard.press('Escape')
    expect(page.locator('#releaseDialog')).to_be_hidden()
    expect(first).to_be_focused()
    page.locator('#listView').click()
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(OUT/'after-mobile-zh.png'),animations='disabled')
    expect(page.locator('#provider')).to_be_hidden()
    page.locator('#filterToggle').click()
    expect(page.locator('#provider')).to_be_visible()
    page.locator('#filterToggle').click()
    expect(page.locator('#provider')).to_be_hidden()
    page.locator('#releaseList .release-row').first.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT/'after-mobile-list-zh.png'),animations='disabled')
    page.locator('#timelineView').click()
    check_chart(page)
    assert_width(page,390)
    page.locator('.chart-event').first.click()
    page.screenshot(path=str(OUT/'after-mobile-detail-zh.png'),animations='disabled')
    page.keyboard.press('Escape')
    page.locator('#period').select_option('all')
    check_chart(page)
    page.locator('#period').select_option('month')
    assert page.locator('.month-event').count()>0
    assert page.locator('.month-span').count()==page.locator('.month-event').count()
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    nojs.route('**/*',lambda route: route.continue_() if urlsplit(route.request.url).netloc==origin else route.abort())
    static=nojs.new_page()
    static.goto(base+'/zh/model-timeline/',wait_until='networkidle')
    assert static.locator('.release-row').count()==len(events)
    assert static.locator('.filters').is_hidden()
    assert_width(static,390)
    assert not errors,errors
    browser.close()
if server: server.shutdown()
result={'events':len(events),'providers':len(data['providers']),'asOf':as_of,'locales':report,'browserErrors':errors,'passed':True}
(OUT/'checks.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
