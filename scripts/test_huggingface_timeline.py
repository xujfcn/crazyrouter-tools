"""Check a standalone timeline export locally or on its deployed Space host."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
APP = 'https://xujfcn-crazyrouter-model-timeline.static.hf.space'
SPACE = 'https://huggingface.co/spaces/xujfcn/Crazyrouter-Model-Timeline'
LANGUAGES = ('en', 'zh', 'zh-TW', 'es', 'ja', 'ru')


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--folder', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--base')
    parser.add_argument('--proxy')
    args = parser.parse_args()
    folder = args.folder.resolve()
    args.output.mkdir(parents=True, exist_ok=True)
    data = json.loads((folder / 'model-timeline/releases.json').read_text(encoding='utf-8'))
    recent = {e['id'] for e in data['events'] if e['date'] >= '2026-08'}
    for lang in LANGUAGES:
        prefix = '' if lang == 'en' else lang + '/'
        soup = BeautifulSoup((folder / prefix / 'index.html').read_text(encoding='utf-8'), 'html.parser')
        original = BeautifulSoup((ROOT / prefix / 'model-timeline/index.html').read_text(encoding='utf-8'), 'html.parser')
        canonical = f'https://crazyrouter.com/tools/{prefix}model-timeline/'
        assert soup.html['lang'] == lang
        assert soup.select_one('link[rel=canonical]')['href'] == canonical
        assert soup.select_one('.mirror-link')['href'] == canonical
        assert original.select_one('.mirror-link')['href'] == f'{APP}/{prefix}index.html'
        assert original.select_one('.hosting-link')['href'] == SPACE
        assert len(soup.select('.release-row')) == len(data['events'])
        assert not soup.select('script[src*="tracking-bridge"]')
        assert not soup.select('a[href^="/tools/"]')
        payload = json.loads(soup.select_one('#timeline-data').string)
        assert payload['events'] == data['events']
        assert payload['providers'] == data['providers']
        page_path = prefix + 'index.html'
        local_base = 'https://export.test/' + page_path
        for asset in soup.select('script[src], link[rel=stylesheet], img[src], a[download]'):
            value = asset.get('src') or asset['href']
            assert not urlsplit(value).netloc, value
            path = urlsplit(urljoin(local_base, value)).path.lstrip('/')
            assert (folder / path).is_file(), (lang, value)
        for anchor in soup.select('.languages a'):
            path = urlsplit(urljoin(local_base, anchor['href'])).path.lstrip('/')
            assert (folder / path).is_file(), (lang, anchor['href'])

    server = None
    base = args.base
    if not base:
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(folder)))
        Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}'
    base = base.rstrip('/')
    origin = urlsplit(base).netloc
    errors, failed, report = [], [], []
    with sync_playwright() as p:
        launch = {'headless': True}
        if args.proxy:
            launch['proxy'] = {'server': args.proxy}
        browser = p.chromium.launch(**launch)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        # Independence: allow only files served by this static export.
        context.route('**/*', lambda route: route.continue_() if urlsplit(route.request.url).netloc == origin else route.abort())
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failed.append({'url': response.url, 'status': response.status}) if response.status >= 400 and urlsplit(response.url).netloc == origin else None)
        for lang in LANGUAGES:
            prefix = '' if lang == 'en' else lang + '/'
            page.goto(f'{base}/{prefix}index.html?view=list', wait_until='networkidle')
            expect(page.locator('html')).to_have_class('enhanced')
            expect(page.locator('#timelinePanel')).to_be_visible()
            expect(page.locator('#releaseList')).to_be_hidden()
            expect(page.locator('#timelineView')).to_have_attribute('aria-pressed', 'true')
            assert 'view=' not in page.url
            assert page.locator('.chart-event').count() == len(recent)
            assert page.locator('img').evaluate_all('images=>images.every(i=>i.complete&&i.naturalWidth>0)')
            assert page.locator('.mirror-link').get_attribute('href') == f'https://crazyrouter.com/tools/{prefix}model-timeline/'
            assert page.locator('.mirror-link').get_attribute('target') == '_blank'
            assert page.evaluate("document.fonts.check('14px \"Public Sans\"')")
            for width in (1440, 768, 390, 320):
                page.set_viewport_size({'width': width, 'height': 1000 if width > 760 else 844})
                assert page.evaluate('document.documentElement.scrollWidth') <= width + 1, (lang, width)
                expect(page.locator('.mirror-link')).to_be_visible()
            report.append({'locale': lang, 'defaultRecords': len(recent), 'widths': [320, 390, 768, 1440]})
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.goto(base + '/zh/index.html', wait_until='networkidle')
        page.screenshot(path=str(args.output / 'space-desktop-zh.png'), animations='disabled')
        page.locator('#period').select_option('all')
        assert page.locator('.chart-event').count() == len(data['events'])
        page.locator('#search').fill('gpt-6.1-terra')
        assert page.locator('.chart-event').count() == 1
        page.locator('.languages a[lang="es"]').click()
        expect(page.locator('html')).to_have_attribute('lang', 'es')
        expect(page.locator('#timelinePanel')).to_be_visible()
        assert page.url.startswith(base + '/es/index.html?')
        assert page.locator('.chart-event').count() == 1
        page.locator('.chart-event').click()
        expect(page.locator('#releaseDialog')).to_be_visible()
        assert page.locator('#detailBody .release-source a').get_attribute('href').startswith('https://')
        page.keyboard.press('Escape')
        page.locator('#listView').click()
        expect(page.locator('#releaseList')).to_be_visible()
        page.reload(wait_until='networkidle')
        expect(page.locator('#timelinePanel')).to_be_visible()
        page.locator('.languages a[lang="zh"]').click()
        page.locator('#reset').click()
        page.set_viewport_size({'width': 390, 'height': 844})
        page.screenshot(path=str(args.output / 'space-mobile-zh.png'), animations='disabled')
        page.locator('#filterToggle').click()
        expect(page.locator('#provider')).to_be_visible()
        page.locator('#provider').select_option('google')
        page.locator('#category').select_option('image')
        assert page.locator('.chart-event').count() > 0
        nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
        nojs.route('**/*', lambda route: route.continue_() if urlsplit(route.request.url).netloc == origin else route.abort())
        fallback = nojs.new_page()
        fallback.goto(base + '/zh/index.html', wait_until='networkidle')
        assert fallback.locator('.release-row').count() == len(data['events'])
        expect(fallback.locator('.filters')).to_be_hidden()
        assert not errors, errors
        assert not failed, failed
        browser.close()
    if server:
        server.shutdown()
    result = {'passed': True, 'base': base, 'asOf': data['asOf'], 'events': len(data['events']), 'locales': report, 'browserErrors': errors, 'failedResources': failed}
    (args.output / 'checks.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
