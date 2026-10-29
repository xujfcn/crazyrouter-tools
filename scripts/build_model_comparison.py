"""Render six model comparison pages from the reviewed historical dataset.

Prices and collection dates must be updated in catalog.json and pricing-snapshot.json
together. This renderer does not infer capabilities or fetch current pricing.
"""
from pathlib import Path
from html import escape
import json
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'model-comparison'
LANGUAGE_LINKS = [
    ('en', 'EN', ''),
    ('es', 'ES', 'es/'),
    ('zh', '中文', 'zh/'),
    ('zh-TW', '繁中', 'zh-TW/'),
    ('ja', '日本語', 'ja/'),
    ('ru', 'RU', 'ru/'),
]
PRICING_LOCALES = {'en': 'en', 'es': 'es', 'zh': 'zh', 'zh-TW': 'zh', 'ja': 'en', 'ru': 'en'}
TOOLS_INDEX_PREFIXES = {'en': '', 'es': '', 'zh': 'zh/', 'zh-TW': 'zh/', 'ja': 'ja/', 'ru': 'ru/'}
data = json.loads((ASSETS / 'catalog.json').read_text(encoding='utf-8'))
locales = json.loads((ASSETS / 'locales.json').read_text(encoding='utf-8'))
providers, models = data['providers'], data['models']
benchmark = json.loads((ASSETS / 'benchmark-snapshot.json').read_text(encoding='utf-8'))
benchmark_date = benchmark['collectedAt'][:10]
data['benchmarkDate'] = benchmark_date
for model in models:
    model['benchmark'] = benchmark['models'].get(model['name'])
    for field in ['gpqa','artificial_analysis_intelligence_index','mmlu_pro','livecodebench']:
        model[field] = model['benchmark']['scores'].get(field) if model['benchmark'] else None

date = data['snapshotDate']
snapshot = json.loads((ASSETS / 'pricing-snapshot.json').read_text(encoding='utf-8'))
assert date == snapshot['collectedAt'][:10]
for model in models:
    recorded = snapshot['models'].get(model['name'], {})
    assert all(model[key] == recorded.get(key) for key in ('modelId', 'input', 'output')), model['name']

def money(value, t):
    return f'<span class="price">${value:g}</span>' if value is not None else f'<span class="unavailable">{escape(t["unavailable"])}</span>'

def score(value, t, index=False):
    if value is None:
        return f'<span class="unavailable">{escape(t["unavailable"])}</span>'
    suffix='' if index else '<small>%</small>'
    return f'<span class="benchmark-score">{value * (1 if index else 100):.1f}{suffix}</span>'

def release_html(model, t):
    r=model.get('release')
    if not r:
        return f'<span class="unavailable">{escape(t["releasePending"])}</span>'
    return f'<time datetime="{r["date"]}">{r["date"]}</time><a class="source-link secondary" href="{escape(r["url"])}" target="_blank" rel="noopener noreferrer" title="{escape(r["variant"])}">{escape(t["releaseReference"])} ↗</a>'

def billing_html(model, t, lang):
    pricing_locale = PRICING_LOCALES.get(lang, 'en')
    url=model['pricingUrl'].replace('/zh/', f'/{pricing_locale}/')
    fixed=f'<span class="price">${model["requestPrice"]:g}</span> · ' if model.get('requestPrice') is not None else ''
    return f'{fixed}<span>{escape(t.get(model["billingMode"],model["billingMode"]))}</span><a class="source-link" href="{escape(url)}" target="_blank" rel="noopener noreferrer">{escape(t["pricingDetails"])} ↗</a>'

def row(model, t, assets, lang):
    provider = providers[model['provider']]
    price_link = f'<a class="source-link" href="{data["source"]}" target="_blank" rel="noopener noreferrer">{t["priceSource"]} ↗</a>' if model['input'] is not None else ''
    aa = model['benchmark']
    benchmark_link = f'<a class="benchmark-variant" href="{escape(aa["url"])}" target="_blank" rel="noopener noreferrer">{escape(aa["name"])} ↗</a>' if aa else ''
    return f'''<tr><td class="select-col"><span class="sr-only">{t['select']}</span></td>
<td class="model-col"><div class="model-cell"><span class="provider-mark"><img src="{assets}{provider['logo']}" width="24" height="24" alt="" aria-hidden="true"/></span><div class="model-name">{escape(model['name'])}<span class="model-provider">{provider['name']} · {t[model['category']]}</span></div></div></td>
<td class="release-cell">{release_html(model,t)}</td><td class="benchmark-cell" data-score="{'' if model['artificial_analysis_intelligence_index'] is None else model['artificial_analysis_intelligence_index']}">{score(model['artificial_analysis_intelligence_index'],t,True)}{benchmark_link}</td><td>{money(model['input'],t)}</td><td>{money(model['output'],t)}</td><td class="billing-cell">{billing_html(model,t,lang)}</td></tr>'''

for lang, t in locales.items():
    assert set(t) == set(locales['en']), lang
    prefix = next(path for code, _, path in LANGUAGE_LINKS if code == lang)
    path = ROOT / prefix / 'model-comparison/index.html'
    assets = './' if lang == 'en' else '../../model-comparison/'
    template = path if path.is_file() else ROOT / 'model-comparison/index.html'
    soup = BeautifulSoup(template.read_text(encoding='utf-8'), 'html.parser')
    for alternate in soup.head.select('link[hreflang]'):
        alternate.decompose()
    for tag in list(soup.head.select('style, link[rel=stylesheet], link[rel=preload], link[rel=icon], script')):
        if tag.get('type') == 'application/ld+json' or tag.get('src') == '/tools/tracking-bridge.js':
            continue
        tag.decompose()
    soup.title.string = t['title'] + ' | CrazyRouter'
    soup.find('meta', attrs={'name':'description'})['content'] = t['description']
    soup.find('meta', attrs={'property':'og:title'})['content'] = t['title']
    soup.find('meta', attrs={'property':'og:description'})['content'] = t['description']
    canonical = f'https://crazyrouter.com/tools/{prefix}model-comparison/'
    soup.find('link', attrs={'rel':'canonical'})['href'] = canonical
    soup.find('meta', attrs={'property':'og:url'})['content'] = canonical
    for code, _, language_prefix in LANGUAGE_LINKS:
        alternate = soup.new_tag('link', rel='alternate', hreflang=code,
                                 href=f'https://crazyrouter.com/tools/{language_prefix}model-comparison/')
        soup.head.append(alternate)
    default_alternate = soup.new_tag('link', rel='alternate', hreflang='x-default',
                                    href='https://crazyrouter.com/tools/model-comparison/')
    soup.head.append(default_alternate)
    schema = soup.find('script', attrs={'type':'application/ld+json'})
    structured = json.loads(schema.string)
    structured.update(name=t['title'],description=t['description'],url=canonical)
    schema.string = json.dumps(structured, ensure_ascii=False)
    head = str(soup.head).replace('</head>', f'<link rel="stylesheet" href="{assets}comparison.css?v=20261029-locales1"/><link rel="icon" href="https://crazyrouter.com/favicon.ico"/><script defer src="{assets}comparison.js?v=20261029-locales1"></script></head>')
    languages = ''.join(f'<a href="https://crazyrouter.com/tools/{language_prefix}model-comparison/" lang="{code}" hreflang="{code}" {"aria-current=page" if code==lang else ""}>{label}</a>' for code,label,language_prefix in LANGUAGE_LINKS)
    models_locale = PRICING_LOCALES.get(lang, 'en')
    tools_prefix = TOOLS_INDEX_PREFIXES.get(lang, '')
    options = ''.join(f'<option value="{key}">{provider["name"]}</option>' for key,provider in providers.items())
    ordered = sorted(models,key=lambda m:(m['releaseDate'] is not None,m['releaseDate'] or '',m['name']),reverse=True)
    rows = '\n'.join(row(m,t,assets,lang) for m in ordered)
    initial_count = t['results'].replace('{count}',str(len(models))).replace('{total}',str(len(models)))
    embedded = json.dumps({**data,'text':t,'assets':assets},ensure_ascii=False).replace('<','\\u003c')
    page = f'''<!doctype html>
<html lang="{lang}">{head}
<body>
<a class="skip" href="#main">{t['skip']}</a>
<header class="site-header"><div class="shell header-inner"><a class="brand" href="https://crazyrouter.com/">Crazyrouter<span>.</span></a><div class="header-nav"><a href="https://crazyrouter.com/{models_locale}/models">{t['currentPrices']} ↗</a><nav class="languages" aria-label="Language">{languages}</nav></div></div></header>
<main class="shell" id="main">
<section class="intro"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/tools/{tools_prefix}">{t['tools']}</a><span aria-hidden="true">/</span><span>{t['title']}</span></nav>
<h1>{t['title']}</h1><p class="lede">{t['description']}</p>
<div class="summary"><div class="summary-item"><strong>{len(models)}</strong><span>{t['models']}</span></div><div class="summary-item"><strong>{len(providers)}</strong><span>{t['providers']}</span></div><div class="summary-item"><strong>{sum(m['input'] is not None for m in models)}</strong><span>{t['priced']}</span></div></div></section>
<aside class="snapshot"><span class="snapshot-dot" aria-hidden="true"></span><div><p><strong>{t['snapshot']} · <time datetime="{date}">{date}</time></strong></p><p>{t['snapshotNote']}</p></div><a class="snapshot-source" href="{assets}pricing-snapshot.json">{t['json']} ↓</a></aside>
<aside class="benchmark-notice"><div><h2>{t['benchmarkTitle']}</h2><p>{t['benchmarkNote'].replace('{count}',str(sum(m['gpqa'] is not None for m in models))).replace('{total}',str(len(models))).replace('{indexCount}',str(sum(m['artificial_analysis_intelligence_index'] is not None for m in models)))}</p><p>{t['benchmarkHint']}</p><p>{t['releaseCoverage'].replace('{count}',str(sum(m['releaseDate'] is not None for m in models)))}</p></div><div class="benchmark-credit"><a href="https://artificialanalysis.ai/" target="_blank" rel="noopener noreferrer">{t['benchmarkSource']} ↗</a><span>{t['benchmarkDate']} · <time datetime="{benchmark['collectedAt']}">{benchmark_date}</time></span><a href="{assets}benchmark-snapshot.json">{t['json']} ↓</a></div></aside>
<noscript><p class="noscript-note">{t['noJs']}</p></noscript>
<div class="workspace">
<section id="browseSection" aria-labelledby="browseTitle"><div class="workspace-head"><h2 id="browseTitle" tabindex="-1">{t['browse']}</h2><p class="js-only">{t['browseHelp']}</p></div>
<div class="filters js-only"><div class="field"><label for="search">{t['search']}</label><input type="search" id="search" placeholder="{t['searchPlaceholder']}" autocomplete="off"/></div><div class="field"><label for="providerFilter">{t['provider']}</label><select id="providerFilter"><option value="all">{t['allProviders']}</option>{options}</select></div><div class="field"><label for="categoryFilter">{t['category']}</label><select id="categoryFilter"><option value="all">{t['allCategories']}</option>{''.join(f'<option value="{kind}">{t[kind]}</option>' for kind in ['text','image','video','audio','embedding','3d'])}</select></div><div class="field"><label for="metricFilter">{t['scoreMetric']}</label><select id="metricFilter"><option value="gpqa">{t['gpqa']}</option><option value="artificial_analysis_intelligence_index" selected>{t['intelligence']}</option><option value="mmlu_pro">{t['mmlu']}</option><option value="livecodebench">{t['coding']}</option></select></div><div class="field"><label for="priceFilter">{t['availability']}</label><select id="priceFilter"><option value="all">{t['allPrices']}</option><option value="available">{t['withPrices']}</option><option value="missing">{t['withoutPrices']}</option></select></div><button class="button" id="resetFilters" type="button">{t['reset']}</button></div>
<div class="table-toolbar"><div><p id="resultsCount" role="status" aria-live="polite">{initial_count}</p><span class="scroll-hint">{t['scroll']} →</span></div><span class="units">{t['units']}</span></div>
<div class="table-scroll" id="tableScroll" tabindex="0" role="region" aria-label="{t['title']}"><table id="modelTable"><caption class="sr-only">{t['title']} · {t['units']} · {date}</caption><thead><tr><th scope="col" class="select-col"><span class="sr-only">{t['select']}</span></th><th scope="col" class="model-col" data-sort="name" aria-sort="none"><button type="button">{t['model']}<span class="sort-arrow" aria-hidden="true">↕</span></button></th><th scope="col" class="release-col" data-sort="releaseDate" aria-sort="descending"><button type="button">{t['releaseDate']}<span class="sort-arrow" aria-hidden="true">↓</span></button></th><th scope="col" class="benchmark-col" id="scoreHeader" data-sort="artificial_analysis_intelligence_index" aria-sort="none"><button type="button"><span id="scoreLabel">{t['intelligence']}</span><span class="sort-arrow" aria-hidden="true">↕</span></button><small id="scoreUnit">{t['indexUnit']}</small></th><th scope="col" class="price-col" data-sort="input" aria-sort="none"><button type="button">{t['input']}<span class="sort-arrow" aria-hidden="true">↕</span></button></th><th scope="col" class="price-col" data-sort="output" aria-sort="none"><button type="button">{t['output']}<span class="sort-arrow" aria-hidden="true">↕</span></button></th><th scope="col" class="billing-col">{t['billing']}</th></tr></thead><tbody id="tbody">{rows}</tbody></table></div>
<div class="empty" id="emptyState" hidden><h3>{t['emptyTitle']}</h3><p>{t['emptyHelp']}</p><button class="button" id="emptyReset" type="button">{t['reset']}</button></div>
<div class="table-bottom"><span>{t['tableNote']}</span><span>{t['sourceNote']}</span></div></section>
<section class="compare-section" id="compareSection" aria-labelledby="compareTitle" hidden><div class="compare-heading"><div><h2 id="compareTitle" tabindex="-1">{t['compareTitle']}</h2><p>{t['compareHelp']}</p></div><button class="button" id="backButton" type="button">← {t['backList']}</button></div><p class="scroll-hint">{t['scroll']} →</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="{t['compareTitle']}"><table class="comparison-table" id="comparisonTable"></table></div><p class="compare-caption">{t['compareNote']}</p></section></div>
<details class="methodology"><summary>{t['methodTitle']}</summary><p>{t['methodIntro'].replace('{date}',date)}</p><ul><li>{t['methodPrices']}</li><li>{t['methodEvidence']}</li></ul></details>
<section class="bottom-cta"><div><h2>{t['ctaTitle']}</h2><p>{t['ctaText']}</p></div><a class="button primary" href="https://crazyrouter.com/{models_locale}/models">{t['cta']} ↗</a></section>
</main>
<footer><div class="shell footer-inner"><span>Crazyrouter · {t['tools']}</span><nav class="footer-links"><a href="https://docs.crazyrouter.com/">{t['apiDocs']}</a><a href="https://crazyrouter.com/privacy-policy">{t['privacy']}</a><a href="https://crazyrouter.com/user-agreement">{t['terms']}</a></nav></div></footer>
<aside class="selection-dock" id="selectionDock" aria-label="{t['compareTitle']}" hidden><div class="selection-info"><strong id="selectedCount"></strong><small id="selectionHint"></small></div><div class="selected-tags" id="compareTags"></div><div class="dock-actions"><button class="button" id="clearSelection" type="button">{t['clear']}</button><button class="button primary" id="compareButton" type="button" disabled>{t['compare']}</button></div></aside>
<div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
<script id="comparison-data" type="application/json">{embedded}</script>
</body></html>'''
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(page,encoding='utf-8',newline='\n')
    print(path.relative_to(ROOT))
