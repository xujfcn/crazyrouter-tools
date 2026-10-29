"""Refresh the public AA snapshot using reviewed stable IDs, never fuzzy names.

Pass --key-file outside this public checkout, or --response-file for a saved
response. Only selected evaluation fields are published; never credentials.
"""
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'model-comparison'
ENDPOINT = 'https://artificialanalysis.ai/api/v2/data/llms/models'
FIELDS = ['artificial_analysis_intelligence_index', 'gpqa', 'mmlu_pro', 'livecodebench']

def build_snapshot(response, mapping, collected_at):
    assert response['status'] == 200
    by_id = {m['id']: m for m in response['data']}
    records = {}
    for name, match in mapping.items():
        model = by_id.get(match['id'])
        # Fail closed if an ID disappears or its identity changes. Review mapping first.
        assert model is not None, f'Missing AA ID for {name}'
        assert model['model_creator']['id'] == match['creatorId'], name
        assert model['name'] == match['reviewedName'], f'Review changed AA variant: {name}'
        scores = {field: model['evaluations'].get(field) for field in FIELDS}
        for field, value in scores.items():
            assert value is None or (type(value) in (int, float) and math.isfinite(value)), (name, field)
            if field != FIELDS[0]:
                assert value is None or 0 <= value <= 1, (name, field)
        records[name] = {'id':model['id'], 'name':model['name'], 'slug':model['slug'],
            'url':'https://artificialanalysis.ai/models/'+model['slug'], 'scores':scores}
    return {'source':'https://artificialanalysis.ai/', 'endpoint':ENDPOINT,
        'collectedAt':collected_at, 'models':records}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--key-file', type=Path)
    group.add_argument('--response-file', type=Path)
    args = parser.parse_args()
    if args.response_file:
        response=json.loads(args.response_file.read_text(encoding='utf-8-sig'))
        collected=datetime.fromtimestamp(args.response_file.stat().st_mtime,timezone.utc)
    else:
        key=args.key_file.read_text(encoding='utf-8-sig').strip()
        request=Request(ENDPOINT,headers={'x-api-key':key})
        with urlopen(request,timeout=45) as result:
            response=json.load(result)
        collected=datetime.now(timezone.utc)
    mapping=json.loads((ASSETS/'benchmark-mapping.json').read_text(encoding='utf-8'))
    snapshot=build_snapshot(response,mapping,collected.isoformat(timespec='seconds'))
    (ASSETS/'benchmark-snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print({field:sum(m['scores'][field] is not None for m in snapshot['models'].values()) for field in FIELDS})
