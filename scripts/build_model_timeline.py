"""Render static, sourced release lists with a shared progressive-enhancement UI."""
from collections import defaultdict
from html import escape as esc
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'model-timeline'
VERSION='20261029-timeline2'
LANGUAGES=[('en','EN',''),('es','ES','es/'),('zh','简中','zh/'),('zh-TW','繁中','zh-TW/'),('ja','日本語','ja/'),('ru','RU','ru/')]
data=json.loads((ASSETS/'releases.json').read_text(encoding='utf-8'))
locales=json.loads((ASSETS/'locales.json').read_text(encoding='utf-8'))
events=data['events']

def month_label(month, lang, t):
    year,index=month.split('-')
    name=t['monthNames'][int(index)-1]
    return f'{year}年{name}' if lang in ('zh','zh-TW','ja') else f'{name} {year}'

def link(url,label,cls='source-link'):
    return f'<a class="{cls}" href="{esc(url)}" target="_blank" rel="noopener noreferrer">{esc(label)} <span aria-hidden="true">↗</span></a>'

def row(e,t,assets):
    provider=data['providers'][e['provider']]
    source=e['source']
    label=t['officialLink'] if source['kind']=='official' else t['datasetLink']
    precision=f'<span class="date-precision">{t["monthOnly"]}</span>' if e['precision']=='month' else ''
    detail=f'<p>{t["referenceVariant"]}: <strong>{esc(source.get("variant",e["name"]))}</strong></p>'
    for ref in e.get('references',[]):
        detail+=f'<p>{t["otherReference"]}: {link(ref["url"],ref["name"])}'
        if ref.get('date'): detail+=f' · <time datetime="{ref["date"]}">{ref["date"]}</time>'
        detail+='</p>'
    if any(r.get('date') and r['date']!=e['date'] for r in e.get('references',[])):
        detail+=f'<p>{t["dateDifference"]}</p>'
    return f'''<article class="release-row" id="release-{e['id']}" data-id="{e['id']}">
<div class="release-date"><time datetime="{e['date']}">{e['date']}</time>{precision}</div>
<div class="release-body"><div class="model-heading"><span class="provider-mark"><img src="{assets}{provider['logo']}" width="24" height="24" alt="" aria-hidden="true"/></span><div><h3>{esc(e['name'])}</h3><p class="release-meta">{esc(provider['name'])}<span aria-hidden="true"> · </span>{t[e['category']]}<span aria-hidden="true"> · </span>{t[e['stage']]}</p></div></div>
<details class="record-details"><summary>{t['details']}</summary>{detail}</details></div>
<div class="release-source" data-kind="{source['kind']}">{link(source['url'],label)}<span>{esc(source['name'])}</span></div></article>'''

for lang,label,prefix in LANGUAGES:
    t=locales[lang]
    assert set(t)==set(locales['en']),lang
    assets='./' if lang=='en' else '../../model-timeline/'
    canonical=f'https://crazyrouter.com/tools/{prefix}model-timeline/'
    pricing_locale=lang if lang in ('zh','en','es') else ('zh' if lang=='zh-TW' else 'en')
    tools_prefix=prefix if lang in ('zh','ja','ru') else ('zh/' if lang=='zh-TW' else '')
    alternates=''.join(f'<link rel="alternate" hreflang="{code}" href="https://crazyrouter.com/tools/{path}model-timeline/"/>' for code,_,path in LANGUAGES)
    languages=''.join(f'<a href="/tools/{path}model-timeline/" lang="{code}" hreflang="{code}" {"aria-current=page" if code==lang else ""}>{name}</a>' for code,name,path in LANGUAGES)
    months=defaultdict(list)
    for e in events: months[e['date'][:7]].append(e)
    groups=''.join(f'<section class="month-group" data-month="{month}" aria-labelledby="month-{month}"><div class="month-heading"><h2 id="month-{month}">{month_label(month,lang,t)}</h2><span class="month-count">{len(records)}</span></div><div class="month-records">'+''.join(row(e,t,assets) for e in records)+'</div></section>' for month,records in months.items())
    options=''.join(f'<option value="{id}">{esc(p["name"])}</option>' for id,p in sorted(data['providers'].items(),key=lambda pair:pair[1]['name']))
    years=sorted({e['date'][:4] for e in events},reverse=True)
    year_options=''.join(f'<option value="{y}">{y}</option>' for y in years)
    this_month=sum(e['date'].startswith(data['asOf'][:7]) for e in events)
    latest=events[0]
    payload=json.dumps({**data,'text':t,'assets':assets},ensure_ascii=False).replace('<','\\u003c')
    schema=json.dumps({'@context':'https://schema.org','@type':'CollectionPage','name':t['title'],'description':t['description'],'url':canonical,'inLanguage':lang,'dateModified':data['asOf'],'isAccessibleForFree':True},ensure_ascii=False)
    html=f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{t['title']} | CrazyRouter</title><meta name="description" content="{esc(t['description'])}"/>
<link rel="canonical" href="{canonical}"/>{alternates}<link rel="alternate" hreflang="x-default" href="https://crazyrouter.com/tools/model-timeline/"/>
<meta property="og:title" content="{t['title']}"/><meta property="og:description" content="{esc(t['description'])}"/><meta property="og:url" content="{canonical}"/><meta property="og:type" content="website"/>
<meta property="og:image" content="https://crazyrouter.com/tools/model-timeline/social-card.png"/><meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" href="https://crazyrouter.com/favicon.ico"/><link rel="stylesheet" href="{assets}timeline.css?v={VERSION}"/>
<script defer src="/tools/tracking-bridge.js"></script><script defer src="{assets}timeline.js?v={VERSION}"></script><script type="application/ld+json">{schema}</script></head>
<body><a class="skip" href="#releases">{t['skip']}</a>
<header class="site-header"><div class="shell header-inner"><a class="brand" href="https://crazyrouter.com/">Crazyrouter<span>.</span></a><div class="header-links"><a href="/tools/{prefix}model-comparison/">{t['compare']}</a><nav class="languages" aria-label="Language">{languages}</nav></div></div></header>
<main class="shell" id="main"><section class="intro"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/tools/{tools_prefix}">{t['tools']}</a><span aria-hidden="true">/</span><span>{t['title']}</span></nav>
<div class="intro-heading"><div><h1>{t['title']}</h1><p class="lede">{t['description']}</p></div><p class="as-of"><span class="status-dot" aria-hidden="true"></span>{t['asOf']}<time datetime="{data['asOf']}">{data['asOf']}</time></p></div>
<div class="stats"><div><strong>{len(events)}</strong><span>{t['records']}</span></div><div><strong>{len(data['providers'])}</strong><span>{t['providers']}</span></div><div><strong>{this_month}</strong><span>{t['thisMonth']}</span></div></div>
<p class="latest"><span>{t['latest']}</span><time datetime="{latest['date']}">{latest['date']}</time><strong>{esc(latest['name'])}</strong><span class="latest-stage">{t[latest['stage']]}</span></p></section>
<section class="workspace" id="releases" aria-labelledby="exploreTitle"><div class="workspace-heading"><h2 id="exploreTitle">{t['explore']}</h2><div class="view-switch js-only" role="group" aria-label="{t['viewLabel']}"><button type="button" id="listView" aria-pressed="false" aria-controls="releaseList">{t['list']}</button><button type="button" id="timelineView" aria-pressed="true" aria-controls="timelinePanel">{t['timeline']}</button></div></div>
<div class="filters js-only"><div class="field search-field"><label for="search">{t['search']}</label><input type="search" id="search" placeholder="{t['searchPlaceholder']}" autocomplete="off"/></div><div class="field"><label for="provider">{t['provider']}</label><select id="provider"><option value="all">{t['allProviders']}</option>{options}</select></div><div class="field"><label for="category">{t['category']}</label><select id="category"><option value="all">{t['allTypes']}</option>{''.join(f'<option value="{c}">{t[c]}</option>' for c in ('text','image','video','audio'))}</select></div><div class="field"><label for="period">{t['period']}</label><select id="period"><option value="recent">{t['recent']}</option><option value="month">{t['month']}</option><option value="year">{t['year']}</option><option value="all">{t['allDates']}</option>{year_options}</select></div><div class="field"><label for="source">{t['source']}</label><select id="source"><option value="all">{t['allSources']}</option><option value="official">{t['official']}</option><option value="dataset">{t['dataset']}</option></select></div><button class="button reset-button" type="button" id="reset">{t['reset']}</button></div>
<noscript><p class="no-js">{t['noJs']}</p></noscript>
<div class="results-toolbar"><p id="resultCount" role="status" aria-live="polite">{t['results'].replace('{count}',str(len(events))).replace('{total}',str(len(events)))}</p><div class="sort-field js-only"><label for="sort">{t['sort']}</label><select id="sort"><option value="newest">{t['newest']}</option><option value="oldest">{t['oldest']}</option></select></div></div>
<div id="releaseList">{groups}</div>
<div id="timelinePanel" hidden><div class="chart-toolbar"><p>{t['chartHelp']}</p><div class="zoom"><button class="button" id="zoomOut" aria-label="{t['zoomOut']}" type="button">−</button><output id="zoomLabel">100%</output><button class="button" id="zoomIn" aria-label="{t['zoomIn']}" type="button">+</button><button class="button" id="fit" type="button">{t['fit']}</button></div></div><div class="chart-scroll" id="chartScroll" tabindex="0" role="region" aria-label="{t['chartLabel']}"><div id="chart" class="chart"></div></div></div>
<div class="empty-state" id="emptyState" hidden><h3>{t['emptyTitle']}</h3><p>{t['emptyText']}</p><button class="button" type="button" id="emptyReset">{t['reset']}</button></div></section>
<details class="methodology"><summary>{t['methodTitle']}</summary><p>{t['methodIntro']}</p><ul><li>{t['methodOfficial']}</li><li>{t['methodDataset']}</li><li>{t['methodMonth']}</li></ul><p>{t['methodCutoff'].replace('{date}',data['asOf'])}</p><div class="method-links"><a href="{assets}releases.json" download>{t['download']} ↓</a>{link('https://artificialanalysis.ai/',t['credit'])}</div></details>
<section class="bottom-cta"><div><h2>{t['ctaTitle']}</h2><p>{t['ctaText']}</p></div><div class="cta-links"><a class="button primary" href="/tools/{prefix}model-comparison/">{t['compare']}</a><a href="https://crazyrouter.com/{pricing_locale}/models">{t['prices']} ↗</a></div></section></main>
<footer><div class="shell footer-inner"><span>Crazyrouter · {t['tools']}</span><nav><a href="https://docs.crazyrouter.com/">{t['apiDocs']}</a><a href="https://crazyrouter.com/privacy-policy">{t['privacy']}</a><a href="https://crazyrouter.com/user-agreement">{t['terms']}</a></nav></div></footer>
<dialog id="releaseDialog" aria-labelledby="detailTitle"><div class="dialog-header"><span>{t['details']}</span><button type="button" id="closeDialog" class="button" aria-label="{t['close']}">×</button></div><div id="detailBody"></div></dialog>
<script id="timeline-data" type="application/json">{payload}</script></body></html>'''
    html=html.replace('<div class="filters js-only">','<div class="filters js-only" id="filters">')
    html=html.replace('<div class="field"><label for="period">','<div class="field period-field"><label for="period">')
    html=html.replace('</div>\n<noscript>',f'<button class="button mobile-filter-toggle" id="filterToggle" type="button" aria-expanded="false" aria-controls="provider category source reset">{t["moreFilters"]}</button></div>\n<noscript>',1)
    path=ROOT/prefix/'model-timeline/index.html'
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(html,encoding='utf-8',newline='\n')
    print(path.relative_to(ROOT))

# Only update timeline URLs in the formal sitemap, preserving all other entries.
namespace='http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('',namespace)
tree=ET.fromstring((ROOT/'sitemap.xml').read_bytes())
by_url={el.find('{*}loc').text:el for el in tree}
for _,_,prefix in LANGUAGES:
    url=f'https://crazyrouter.com/tools/{prefix}model-timeline/'
    el=by_url.get(url)
    if el is None:
        el=ET.SubElement(tree,f'{{{namespace}}}url')
        ET.SubElement(el,f'{{{namespace}}}loc').text=url
    modified=el.find('{*}lastmod')
    if modified is None: modified=ET.SubElement(el,f'{{{namespace}}}lastmod')
    modified.text=data['asOf']
xml=ET.tostring(tree,encoding='unicode')
xml=re.sub(r'>\s+<','><',xml).replace('<url>','\n  <url>').replace('</urlset>','\n  </urlset>')
(ROOT/'sitemap.xml').write_text("<?xml version='1.0' encoding='utf-8'?>\n"+xml+'\n',encoding='utf-8')
urls=[el.find('{*}loc').text for el in tree]
(ROOT/'sitemap.txt').write_text('\n'.join(urls)+'\n',encoding='utf-8')
