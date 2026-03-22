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
    if not path.exists():
        return data
    with path.open(newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            data[row['key']] = int(row['rank'])
    return data


def title_from_slug(slug: str):
    tail = slug.split('/')[-1]
    tail = tail.replace(':free', '').replace(':thinking', '')
    words = tail.replace('.', ' ').replace('_', ' ').replace('-', ' ').split()
    return ' '.join(w.upper() if w.isupper() else (w.capitalize() if not any(ch.isdigit() for ch in w[:1]) else w.capitalize()) for w in words)


def provider_from_slug(slug: str):
    head = slug.split('/')[0]
    mapping = {
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'google': 'Google',
        'deepseek': 'DeepSeek',
        'x-ai': 'xAI',
        'xai': 'xAI',
        'qwen': 'Qwen',
        'meta-llama': 'Meta',
        'mistralai': 'Mistral',
        'stepfun': 'Stepfun',
        'z-ai': 'Z.ai',
        'xiaomi': 'Xiaomi',
        'openrouter': 'OpenRouter',
        'minimax': 'MiniMax',
    }
    return mapping.get(head, head.title())


def category_from_slug(slug: str):
    s = slug.lower()
    if 'flash' in s or 'turbo' in s or 'mini' in s:
        return 'fast'
    if 'reason' in s or 'r1' in s or 'thinking' in s or 'mimo' in s:
        return 'reasoning'
    if 'llama' in s:
        return 'open'
    return 'flagship'


def main():
    models_config = json.loads((SOURCES / 'models.json').read_text(encoding='utf-8'))
    ranks = {
        'openrouter': read_csv_map(SOURCES / 'openrouter.csv'),
        'lmsys': read_csv_map(SOURCES / 'lmsys.csv'),
        'artificial': read_csv_map(SOURCES / 'artificial.csv'),
        'opencompass': read_csv_map(SOURCES / 'opencompass.csv'),
    }

    models = []
    existing_keys = set()
    for model in models_config['models']:
        model = dict(model)
        key = model['key']
        existing_keys.add(key)
        model['ranks'] = {source: mapping[key] for source, mapping in ranks.items() if key in mapping}
        models.append(model)

    unmapped_file = SOURCES / 'openrouter_unmapped.csv'
    if unmapped_file.exists():
        with unmapped_file.open(newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                key = row['fallback_key']
                slug = row['slug']
                if key in existing_keys:
                    continue
                models.append({
                    'key': key,
                    'name': title_from_slug(slug),
                    'provider': provider_from_slug(slug),
                    'category': category_from_slug(slug),
                    'supportStatus': 'watchlist',
                    'capabilityScore': 72,
                    'businessScore': 60,
                    'recommendedFor': ['watchlist', 'new-model'],
                    'notes': f'Auto-imported from OpenRouter rankings: {slug}',
                    'ranks': {'openrouter': int(row['rank'])},
                })

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
