"""Export the generated timeline as a self-contained, six-language static Space."""
import argparse
import hashlib
import json
import posixpath
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SPACE = 'https://huggingface.co/spaces/xujfcn/Crazyrouter-Model-Timeline'
APP = 'https://xujfcn-crazyrouter-model-timeline.static.hf.space'
LANGUAGES = ('en', 'zh', 'zh-TW', 'es', 'ja', 'ru')


def build(output):
    output = output.resolve()
    if output == ROOT or output in ROOT.parents:
        raise ValueError('The export must have its own output directory')
    data = json.loads((ROOT / 'model-timeline/releases.json').read_text(encoding='utf-8'))
    locales = json.loads((ROOT / 'model-timeline/locales.json').read_text(encoding='utf-8'))
    assets = {
        'model-timeline/timeline.css', 'model-timeline/timeline.js',
        'model-timeline/releases.json', 'model-timeline/social-card.png',
        'model-comparison/public-sans-latin.woff2',
    }
    for provider in data['providers'].values():
        asset = (ROOT / 'model-timeline' / provider['logo']).resolve()
        assets.add(asset.relative_to(ROOT).as_posix())
    files = set(assets)
    for name in assets:
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)

    for lang in LANGUAGES:
        prefix = '' if lang == 'en' else lang + '/'
        source = ROOT / prefix / 'model-timeline/index.html'
        page_path = prefix + 'index.html'
        page_dir = prefix.rstrip('/') or '.'
        relative_assets = posixpath.relpath('model-timeline', page_dir) + '/'
        soup = BeautifulSoup(source.read_text(encoding='utf-8'), 'html.parser')
        for script in soup.select('script[src]'):
            if urlsplit(script['src']).path == '/tools/tracking-bridge.js':
                script.decompose()
        for node in soup.select('script[src], link[rel=stylesheet], img[src], a[download]'):
            attr = 'src' if node.has_attr('src') else 'href'
            parsed = urlsplit(node[attr])
            if parsed.scheme or parsed.netloc:
                continue
            asset = (source.parent / parsed.path).resolve().relative_to(ROOT).as_posix()
            if asset not in assets:
                raise ValueError(f'Unexported page resource: {asset}')
            node[attr] = posixpath.relpath(asset, page_dir) + (f'?{parsed.query}' if parsed.query else '')
        payload = soup.select_one('#timeline-data')
        embedded = json.loads(payload.string)
        assert embedded['events'] == data['events']
        embedded['assets'] = relative_assets
        payload.string = json.dumps(embedded, ensure_ascii=False).replace('<', '\\u003c')
        for anchor in soup.select('.languages a'):
            target = ('' if anchor['lang'] == 'en' else anchor['lang'] + '/') + 'index.html'
            anchor['href'] = posixpath.relpath(target, page_dir)
        for anchor in soup.select('a[href]'):
            if anchor['href'].startswith('/tools/'):
                anchor['href'] = 'https://crazyrouter.com' + anchor['href']
            if anchor['href'].startswith('https://crazyrouter.com'):
                anchor['target'] = '_blank'
                anchor['rel'] = ['noopener', 'noreferrer']
        canonical = soup.select_one('link[rel=canonical]')['href']
        backlink = soup.select_one('.mirror-link')
        backlink['href'] = canonical
        backlink.clear()
        backlink.append(locales[lang]['originalLink'] + ' ')
        arrow = soup.new_tag('span', attrs={'aria-hidden': 'true'})
        arrow.string = '↗'
        backlink.append(arrow)
        platform = soup.new_tag('span', attrs={'class': 'edition-platform'})
        platform.string = 'Hugging Face Space'
        soup.select_one('.edition-links').insert(0, platform)
        soup.select_one('meta[property="og:image"]')['content'] = APP + '/model-timeline/social-card.png'
        soup.body['data-hosting'] = 'huggingface'
        target = output / page_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(str(soup) + '\n', encoding='utf-8', newline='\n')
        files.add(page_path)

    readme = f'''---
title: AI Model Release Timeline
emoji: 🗓️
colorFrom: green
colorTo: gray
sdk: static
app_file: index.html
pinned: false
short_description: Provider timelines for AI model releases in six languages
tags:
  - ai
  - model-timeline
  - multilingual
---

# AI model release timeline · Crazyrouter

Explore **{len(data['events'])} release records across {len(data['providers'])} providers**,
reviewed through **{data['asOf']}**. The provider timeline opens by default.
Search models, filter releases, zoom the chart, or switch to the release list.
Each record retains its date precision and source link.

This is a standalone static edition of the
[Crazyrouter model release timeline](https://crazyrouter.com/tools/model-timeline/).
The website and this Space link to each other. The original website remains
the canonical source. This is a dated snapshot, not a live feed; an entry does
not imply current API availability.

## Languages

[English]({APP}/index.html) · [简体中文]({APP}/zh/index.html) ·
[繁體中文]({APP}/zh-TW/index.html) · [Español]({APP}/es/index.html) ·
[日本語]({APP}/ja/index.html) · [Русский]({APP}/ru/index.html)

## Sources and related tools

Dates link to provider announcements, changelogs, research papers or clearly
labelled [Artificial Analysis](https://artificialanalysis.ai/) records.
Month-only dates remain month-only. Model names and provider marks belong to
their respective owners.

- [Original timeline, 中文](https://crazyrouter.com/tools/zh/model-timeline/)
- [Compare models](https://crazyrouter.com/tools/model-comparison/)
- [Available models and API pricing](https://crazyrouter.com/en/models)
- [API documentation](https://docs.crazyrouter.com/)
- [Website source](https://github.com/xujfcn/crazyrouter-tools)

The HTML, chart script, stylesheet, font, logos and release data are served
by this Space. No API key or server is required to use it.
'''
    (output / 'README.md').write_text(readme, encoding='utf-8', newline='\n')
    files.add('README.md')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    manifest = {
        'repo': 'xujfcn/Crazyrouter-Model-Timeline', 'sourceCommit': commit,
        'asOf': data['asOf'], 'events': len(data['events']), 'providers': len(data['providers']),
        'files': {name: hashlib.sha256((output / name).read_bytes()).hexdigest() for name in sorted(files)},
    }
    (output / 'build-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(output), 'files': len(files) + 1, 'events': manifest['events'], 'asOf': manifest['asOf']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    build(parser.parse_args().output)
