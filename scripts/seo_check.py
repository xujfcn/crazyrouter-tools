"""Check formal tools sitemap, metadata, language targets and radar resources."""
from pathlib import Path
from urllib.parse import urlsplit, urljoin
import json, sys, xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://crazyrouter.com'
errors = []
urls = [x.text for x in ET.fromstring((ROOT / 'sitemap.xml').read_bytes()).findall('{*}url/{*}loc')]
assert urls and len(urls) == len(set(urls)), 'Empty or duplicate sitemap'
def source(url):
    parsed = urlsplit(url)
    if parsed.netloc != 'crazyrouter.com' or not parsed.path.startswith('/tools/') or parsed.query:
        return None
    relative = parsed.path[len('/tools/'):]
    return ROOT / relative / 'index.html' if parsed.path.endswith('/') else ROOT / relative

for url in urls:
    file = source(url)
    if not file or not file.is_file(): errors.append(f'{url}: wrong host/path or missing file'); continue
    b = BeautifulSoup(file.read_text(encoding='utf8'), 'html.parser')
    if [x.get('href') for x in b.select('link[rel="canonical"]')] != [url]: errors.append(f'{url}: canonical mismatch')
    if len(b.find_all('h1')) != 1: errors.append(f'{url}: H1 count')
    if not b.title or not b.find('meta', attrs={'name': 'description'}): errors.append(f'{url}: missing metadata')
    for alt in b.select('link[hreflang]'):
        target = source(alt['href'])
        if not target or not target.is_file(): errors.append(f'{url}: missing language target'); continue
        other = BeautifulSoup(target.read_text(encoding='utf8'), 'html.parser')
        if url not in [x.get('href') for x in other.select('link[hreflang]')]: errors.append(f'{url}: missing language return link')
    if '/model-radar/' in url:
        for script in b.select('script[src]'):
            resource = source(urljoin(url, script['src']))
            if not resource or not resource.is_file(): errors.append(f'{url}: missing resource {script["src"]}')
        if not b.select('#radarBody tr'): errors.append(f'{url}: missing static model rows')
        if b.select_one('#radarBody .score'): errors.append(f'{url}: unverified score displayed')
    if '/model-comparison/' in url:
        if not b.select('#tbody tr'): errors.append(f'{url}: missing static comparison')
        if 'mmlu:93.5' in str(b): errors.append(f'{url}: legacy score returned')
report = {'pages': len(urls), 'errors': errors}
print(json.dumps(report, ensure_ascii=True))
sys.exit(bool(errors))
