#!/usr/bin/env python3
import csv
import json
from pathlib import Path

BASE = Path('/root/.openclaw/workspace/crazyrouter-tools/model-radar')
SOURCES = BASE / 'sources'
OUT = BASE / 'data.js'

SOURCE_META = {
    'openrouter': {
        'label': 'OpenRouter Rankings',
        'description': 'Ecosystem popularity and developer usage trends',
        'url': 'https://openrouter.ai/rankings'
    },
    'lmsys': {
        'label': 'LMSYS Arena',
        'description': 'Human preference and head-to-head quality signals',
        'url': 'https://lmarena.ai/'
    },
    'artificial': {
        'label': 'Artificial Analysis',
        'description': 'Composite quality, speed, and value reference',
        'url': 'https://artificialanalysis.ai/'
    },
    'opencompass': {
        'label': 'OpenCompass',
        'description': 'Benchmark-oriented evaluation coverage',
        'url': 'https://rank.opencompass.org.cn/'
    }
}


def read_csv_map(path: Path):
    data = {}
    with path.open(newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            data[row['key']] = int(row['rank'])
    return data


def main():
    models_config = json.loads((SOURCES / 'models.json').read_text(encoding='utf-8'))
    ranks = {
        'openrouter': read_csv_map(SOURCES / 'openrouter.csv'),
        'lmsys': read_csv_map(SOURCES / 'lmsys.csv'),
        'artificial': read_csv_map(SOURCES / 'artificial.csv'),
        'opencompass': read_csv_map(SOURCES / 'opencompass.csv'),
    }

    models = []
    for model in models_config['models']:
        model = dict(model)
        key = model['key']
        model['ranks'] = {source: mapping[key] for source, mapping in ranks.items() if key in mapping}
        models.append(model)

    payload = {
        'weights': models_config['weights'],
        'sourceMeta': SOURCE_META,
        'models': models,
    }

    content = 'window.MODEL_RADAR_DATA = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n'
    OUT.write_text(content, encoding='utf-8')
    print(f'Wrote {OUT}')
    print(f'Model count: {len(models)}')


if __name__ == '__main__':
    main()
