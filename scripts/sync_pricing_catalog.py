"""Build a full pricing-page catalogue with conservative unit-safe prices.

Inputs are public cached pricing data, reviewed release references and AA mapping.
Unknown dates stay null; dynamic and media prices are linked to the pricing page
instead of treating placeholder model ratios as actual token prices.
"""
from pathlib import Path
import json,re
from urllib.parse import quote
from datetime import date
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'model-comparison'
def hidden(m):
    return m['model_name'].lower()=='suno_music' or 'llama' in (m['model_name']+' '+m.get('series','')).lower()
def category(m):
    n=m['model_name'].lower()
    if n.startswith('hy-3d'): return '3d'
    if 'embedding' in n or 'rerank' in n: return 'embedding'
    if any(k in n for k in ['speech','audio','whisper']): return 'audio'
    if m.get('video_pricing') or any(k in n for k in ['video','seedance','hailuo','wan2','wan3']): return 'video'
    if m.get('image_pricing') or any(k in n for k in ['image','seedream','nano-banana','cogview','mj_']): return 'image'
    return 'text'
def main():
    source=json.loads((A/'pricing-source.json').read_text(encoding='utf-8'))
    releases=json.loads((A/'release-sources.json').read_text(encoding='utf-8'))
    vendors={v['id']:v for v in source['vendors']}
    brand_ids={2:'deepseek',4:'openai',5:'qwen',6:'anthropic',8:'kling',9:'zhipu',10:'xai',12:'moonshot',13:'doubao',31:'google',41:'midjourney',42:'minimax',55:'xiaomi',92:'google',93:'pixverse',94:'typesafe'}
    brands={'deepseek':'DeepSeek','openai':'OpenAI','qwen':'Alibaba / Qwen','anthropic':'Anthropic','kling':'Kuaishou / Kling','zhipu':'Zhipu / Z.ai','xai':'xAI','moonshot':'Moonshot / Kimi','doubao':'ByteDance / Doubao','google':'Google','midjourney':'Midjourney','minimax':'MiniMax','xiaomi':'Xiaomi','pixverse':'PixVerse','typesafe':'TypeSafe','tencent':'Tencent'}
    providers={}
    models=[]
    collected=source['collectedAt']
    for m in source['data']:
        if hidden(m): continue
        n=m['model_name']
        brand=brand_ids.get(m.get('vendor_id'))
        if not brand:
            if n.startswith('hy-3d') or n=='youtu-vita': brand='tencent'
            elif n=='aigc-video-hailuo-h3': brand='minimax'
            else: raise ValueError('Review missing vendor: '+n)
        # Model icon overrides identify brands correctly even on reseller records.
        if n=='glm-5.3-prime': brand='zhipu'
        if n=='aigc-image-kling-3.0': brand='kling'
        providers[brand]={'name':brands[brand],'logo':'logos/'+brand+('.png' if brand=='typesafe' else '.svg'),'url':'https://crazyrouter.com/zh/models'}
        kind=category(m)
        mode=m.get('billing_mode') or ('per_token' if m['quota_type']==0 else 'per_request')
        discount=m.get('group_discounts',{}).get('default',m.get('discount',1))
        multiplier=source['group_ratio'].get('default',1)*discount
        input_price=output_price=None
        # Fixed token prices only. Image/audio dimensions need their own pricing view.
        flat=m['quota_type']==0 and mode=='per_token' and kind in ['text','embedding'] and not any(m.get(k) for k in ['image_pricing','video_pricing','time_pricing'])
        if flat:
            input_price=round(m['model_ratio']*2*multiplier,8)
            output_price=round(input_price*m['completion_ratio'],8) if kind=='text' else None
        release=releases.get(n)
        if release:
            assert re.fullmatch(r'\d{4}-\d{2}(-\d{2})?',release['date']),n
            assert release['date'][:7]<=collected[:7],n
            if len(release['date'])==10: assert date.fromisoformat(release['date'])<=date.fromisoformat(collected[:10]),n
        models.append({'name':n,'provider':brand,'modelId':n,'input':input_price,'output':output_price,
            'category':kind,'billingMode':mode,'releaseDate':release['date'] if release else None,
            'release':release,'pricingUrl':'https://crazyrouter.com/zh/models?search='+quote(n),
            'requestPrice':round(m['model_price']*multiplier,8) if m['quota_type']==1 and mode=='per_request' and m.get('model_price',0)>0 and not m.get('video_pricing') and not m.get('image_pricing') else None})
    assert len({m['modelId'] for m in models})==len(models)
    models.sort(key=lambda m:m['name'].lower())
    catalog={'snapshotDate':collected[:10],'collectedAt':collected,'source':'https://crazyrouter.com/api/pricing','providers':providers,'models':models}
    snapshot={'source':catalog['source'],'collectedAt':collected,'currency':'USD','unit':'per million tokens (fixed text/embedding only)','group':'default','models':{m['name']:{k:m[k] for k in ['modelId','input','output','billingMode','requestPrice']} for m in models}}
    for filename,data in [('catalog.json',catalog),('pricing-snapshot.json',snapshot)]:
        (A/filename).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print({'models':len(models),'providers':len(providers),'releaseDates':sum(m['releaseDate'] is not None for m in models),'fixedTokenPrices':sum(m['input'] is not None for m in models)})
if __name__=='__main__': main()
