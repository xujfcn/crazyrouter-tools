"""Build dated timeline records from a saved AA response and reviewed sources.

The authenticated response stays outside this public checkout. Only dates,
model identities and public source URLs are published. Never turn effort
settings into separate releases, or month precision into an exact day.
"""
import argparse
from datetime import date
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'model-timeline'
HISTORICAL = '''
gpt-35-turbo gpt-4 gpt-4-turbo gpt-4o-2024-05-13 gpt-4-5
o1-preview o1-mini o1 o3-mini o4-mini o3-pro
claude-2 claude-21 claude-3-opus claude-3-sonnet claude-3-haiku
claude-35-sonnet-june-24 claude-35-sonnet claude-3-5-haiku
claude-3-7-sonnet-thinking claude-4-sonnet-thinking claude-4-opus-thinking
claude-4-1-opus-thinking
palm-2 gemini-1-0-pro gemini-2-0-flash-experimental gemini-2-0-flash
gemini-2-5-pro-03-25 gemini-3-pro gemini-3-6-flash gemini-3-5-flash-lite
llama-65b llama-2-chat-70b llama-3-instruct-70b llama-3-1-instruct-405b
llama-3-2-instruct-90b-vision llama-3-3-instruct-70b llama-4-scout llama-4-maverick
muse-spark muse-spark-1-1 muse-spark-1-2 muse-glimmer
deepseek-v2 deepseek-v3 deepseek-r1-0120 deepseek-r1 deepseek-v3-0324
deepseek-v3-1-reasoning deepseek-v3-1-terminus-reasoning deepseek-v3-2-reasoning
deepseek-v3-2-reasoning-0925 deepseek-v4-flash-0420 deepseek-v4-pro-0424
mistral-7b-instruct mixtral-8x7b-instruct mistral-large mistral-8x22b-instruct
mistral-large-2407 mistral-small-3 mistral-medium-3 mistral-large-3 mistral-small-4
grok-beta grok-3 grok-4
qwen2-72b-instruct qwen2-5-72b-instruct qwq-32b
qwen3-235b-a22b-instruct-reasoning qwen3-max qwen3-max-thinking
qwen3-coder-next qwen3-5-397b-a17b qwen3-8-2-4t-a95b
kimi-k2 kimi-k2-thinking
'''.split()
CREATORS = {'alibaba':'qwen', 'kimi':'moonshot', 'zai':'zhipu'}
CORE = {'openai','anthropic','google','meta','mistral','deepseek','qwen','moonshot','zhipu','minimax','xiaomi','xai'}
OPENAI = 'https://developers.openai.com/api/docs/changelog'
GOOGLE = 'https://ai.google.dev/gemini-api/docs/changelog'
DEEPSEEK = 'https://api-docs.deepseek.com/updates/'

def clean_name(name):
    return re.sub(r'\s+\((?:Max|Xhigh|High|Medium|Low|Reasoning|Non-reasoning|Adaptive|high|max)(?:[, ].*)?\)$', '', name)

def build(response, collected_at, as_of):
    assert response['status'] == 200
    assert collected_at[:10] == as_of, 'Use a response collected on the review date'
    comparison = json.loads((ROOT/'model-comparison/catalog.json').read_text(encoding='utf-8'))
    providers = {k:{'name':v['name'],'logo':'../model-comparison/'+v['logo']} for k,v in comparison['providers'].items()}
    providers.update({'meta':{'name':'Meta','logo':'../model-comparison/logos/meta.svg'},'mistral':{'name':'Mistral','logo':'../model-comparison/logos/mistral.svg'}})
    by_slug = {m['slug']:m for m in response['data']}
    events = {}
    def from_aa(slug, aliases=()):
        m=by_slug[slug]
        creator=m['model_creator']['slug']
        provider=CREATORS.get(creator,creator)
        assert provider in providers, (slug,creator)
        day=m.get('release_date')
        if not day or day>as_of: return
        name=clean_name(m['name'])
        if slug not in events:
            events[slug]={'id':slug,'name':name,'provider':provider,'category':'text','date':day,
                'stage':'preview' if re.search(r'preview|experimental|\bexp\b',name,re.I) else 'release',
                'aliases':[], 'source':{'name':'Artificial Analysis','kind':'dataset','url':'https://artificialanalysis.ai/models/'+slug,'variant':m['name'],'checkedAt':as_of}}
        events[slug]['aliases']=sorted(set(events[slug]['aliases'])|set(aliases))
    # The priced catalogue is a selection source, not proof of a release date.
    for m in comparison['models']:
        r=m.get('release')
        if not r: continue
        if m['category']=='text':
            from_aa(r['url'].rsplit('/',1)[-1], [m['name']])
        else:
            events[m['name']]={'id':m['name'],'name':r['variant'],'provider':m['provider'],
                'category':m['category'],'date':r['date'],'stage':'release','aliases':[m['name']],
                'source':{'name':r['source'],'kind':'dataset','url':r['url'],'variant':r['variant'],'checkedAt':comparison['snapshotDate']}}
    for slug in HISTORICAL:
        assert slug in by_slug, f'Review removed/renamed AA model: {slug}'
        from_aa(slug)
    # Add recent releases from the existing provider coverage, including models
    # not currently in CrazyRouter's catalogue. Exclude alternate effort runs.
    seen={(e['provider'],e['name'],e['date']) for e in events.values()}
    for m in response['data']:
        provider=CREATORS.get(m['model_creator']['slug'],m['model_creator']['slug'])
        key=(provider,clean_name(m['name']),m.get('release_date'))
        if provider in CORE and '2026-09-01'<=m.get('release_date','')<=as_of and key not in seen:
            from_aa(m['slug']);seen.add(key)

    def official(id, day, name, provider, url, stage='release', category='text'):
        old=events.get(id)
        record={'id':id,'name':name,'provider':provider,'category':category,'date':day,'stage':stage,
                'aliases':old['aliases'] if old else [],
                'source':{'name':providers[provider]['name'],'kind':'official','url':url,'checkedAt':as_of}}
        if old:
            record['references']=[{'date':old['date'],**old['source']}]
        events[id]=record
    official('gpt-3-paper','2020-05-28','GPT-3','openai','https://arxiv.org/abs/2005.14165','research')
    official('claude-1','2023-03-14','Claude 1','anthropic','https://www.anthropic.com/news/introducing-claude')
    official('claude-3-haiku','2024-03-13','Claude 3 Haiku','anthropic','https://www.anthropic.com/news/claude-3-haiku')
    official('claude-35-sonnet-june-24','2024-06-21','Claude 3.5 Sonnet (June 2024)','anthropic','https://www.anthropic.com/news/claude-3-5-sonnet')
    official('claude-4-5-sonnet-thinking','2025-09-29','Claude Sonnet 4.5','anthropic','https://www.anthropic.com/news/claude-sonnet-4-5')
    official('claude-haiku-5-5','2026-10-07','Claude Haiku 5.5','anthropic','https://www.anthropic.com/claude-haiku-5-5')
    official('gemini-1-5-pro-preview','2024-02-15','Gemini 1.5 Pro','google','https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/','preview')
    for id,day,name,stage in [
        ('gemini-2-5-pro-03-25','2025-03-25','Gemini 2.5 Pro (03-25)','preview'),
        ('gemini-3-8-flash','2026-09-02','Gemini 3.8 Flash','ga'),
        ('gemini-4-argon-ga','2026-10-13','Gemini 4 Argon','ga'),
    ]: official(id,day,name,'google',GOOGLE,stage)
    official('nano-banana-2.1','2026-10-06','Nano Banana 2.1','google',GOOGLE,'ga','image')
    for id,day,name in [
        ('gpt-6-1-terra','2026-10-26','GPT-6.1 Terra'),('gpt-6-1-sol','2026-09-29','GPT-6.1 Sol'),
        ('gpt-6-sol','2026-09-22','GPT-6 Sol'),('gpt-6-luna','2026-09-22','GPT-6 Luna'),('gpt-6-astra','2026-09-03','GPT-6 Astra'),
        ('gpt-5-6-sol','2026-07-09','GPT-5.6 Sol'),('gpt-5-6-terra','2026-07-09','GPT-5.6 Terra'),('gpt-5-6-luna','2026-07-09','GPT-5.6 Luna'),
    ]: official(id,day,name,'openai',OPENAI,'api')
    for id,day,name in [('gpt-image-2.5-sunburst','2026-09-08','GPT Image 2.5 Sunburst'),('gpt-image-2.5-flare','2026-09-08','GPT Image 2.5 Flare'),('gpt-image-2','2026-04-21','GPT Image 2')]:
        official(id,day,name,'openai',OPENAI,'api','image')
    official('gpt-live-1','2026-09-10','GPT-Live 1','openai',OPENAI,'ga','audio')
    official('gemini-3-8-flash-tts','2026-09-22','Gemini 3.8 Flash TTS','google',GOOGLE,'ga','audio')
    official('gemini-3-8-flash-lite-tts','2026-09-22','Gemini 3.8 Flash-Lite TTS','google',GOOGLE,'ga','audio')
    for id,day,name,stage in [
        ('deepseek-v3','2024-12-26','DeepSeek-V3','release'),('deepseek-r1-0120','2025-01-20','DeepSeek-R1','release'),
        ('deepseek-v3-0324','2025-03-24','DeepSeek-V3-0324','update'),('deepseek-r1','2025-05-28','DeepSeek-R1-0528','update'),
        ('deepseek-v3-1-reasoning','2025-08-21','DeepSeek-V3.1','release'),('deepseek-v3-1-terminus-reasoning','2025-09-22','DeepSeek-V3.1-Terminus','update'),
        ('deepseek-v3-2-reasoning-0925','2025-09-29','DeepSeek-V3.2-Exp','preview'),('deepseek-v3-2-reasoning','2025-12-01','DeepSeek-V3.2','release'),
        ('deepseek-v4-flash-0420','2026-04-24','DeepSeek-V4-Flash (0424)','preview'),('deepseek-v4-pro-0424','2026-04-24','DeepSeek-V4-Pro (0424)','preview'),
        ('deepseek-v4-flash','2026-07-31','DeepSeek-V4-Flash (0731)','update'),('deepseek-v4-pro','2026-08-13','DeepSeek-V4-Pro (0813)','ga'),
        ('deepseek-v4-1-flash','2026-09-10','DeepSeek-V4.1-Flash','release'),('deepseek-v4-1-flash-1017','2026-10-17','DeepSeek-V4.1-Flash-1017','update'),
    ]: official(id,day,name,'deepseek',DEEPSEEK,stage)
    for id,name in [('llama-4-scout','Llama 4 Scout'),('llama-4-maverick','Llama 4 Maverick')]:
        official(id,'2025-04-05',name,'meta','https://ai.meta.com/blog/llama-4-multimodal-intelligence/','weights')
    official('qwen3-235b-a22b-instruct-reasoning','2025-04-29','Qwen3 (235B A22B)','qwen','https://qwenlm.github.io/blog/qwen3/','weights')
    official('qwq-32b','2025-03-06','QwQ-32B','qwen','https://qwenlm.github.io/blog/qwq-32b/','weights')
    official('grok-4','2025-07-09','Grok 4','xai','https://x.ai/news/grok-4')
    official('mistral-7b-instruct','2023-09-27','Mistral 7B','mistral','https://mistral.ai/news/announcing-mistral-7b/','weights')
    official('mistral-medium-3','2025-05-07','Mistral Medium 3','mistral','https://mistral.ai/news/mistral-medium-3/')
    official('mistral-large-4-preview','2026-10-06','Mistral Large 4','mistral','https://mistral.ai/news/mistral-large-4/','preview')
    # AA supplies the exact date; the provider confirms the weights release.
    events['mistral-large-4']['stage']='weights'
    events['mistral-large-4']['references']=[{'name':'Mistral','kind':'official','url':'https://mistral.ai/news/mistral-large-4-oss/','checkedAt':as_of}]
    # Keep AA's date and expose the differing provider publication date explicitly.
    events['kimi-k3-1-pro']['references']=[{'date':'2026-10-24','name':'Moonshot / Kimi','kind':'official','url':'https://www.kimi.com/blog/','checkedAt':as_of}]

    # Merge reasoning/non-reasoning AA records for the same release; preserve
    # distinct snapshots, preview/GA milestones and the reference variant.
    dedup={}
    for e in events.values():
        key=(e['provider'],e['name'],e['date'],e['stage'])
        if key in dedup:
            dedup[key]['aliases']=sorted(set(dedup[key]['aliases']+e['aliases']))
        else: dedup[key]=e
    records=sorted(dedup.values(),key=lambda e:(e['date'],e['name']),reverse=True)
    for e in records:
        e['precision']='day' if len(e['date'])==10 else 'month'
        date.fromisoformat(e['date'] if e['precision']=='day' else e['date']+'-01')
        assert e['date']<=as_of
    providers={k:v for k,v in providers.items() if any(e['provider']==k for e in records)}
    return {'asOf':as_of,'collectedAt':collected_at,'aaEndpoint':'https://artificialanalysis.ai/api/v2/data/llms/models',
        'providers':providers,'events':records}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--aa-file',type=Path,required=True)
    p.add_argument('--collected-at',required=True)
    p.add_argument('--as-of',required=True)
    args=p.parse_args()
    data=build(json.loads(args.aa_file.read_text(encoding='utf-8-sig')),args.collected_at,args.as_of)
    (ASSETS/'releases.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'events':len(data['events']),'providers':len(data['providers']),'official':sum(e['source']['kind']=='official' for e in data['events'])}))
