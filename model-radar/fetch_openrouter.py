#!/usr/bin/env python3
import codecs
import csv
import json
import re
from pathlib import Path

import requests

BASE = Path('/root/.openclaw/workspace/crazyrouter-tools/model-radar')
SOURCES = BASE / 'sources'
OUT = SOURCES / 'openrouter.csv'
UNMAPPED_OUT = SOURCES / 'openrouter_unmapped.csv'
URL = 'https://openrouter.ai/rankings'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

# Map OpenRouter model slugs -> local model keys used by model-radar
ALIASES = {
    'anthropic/claude-3-7-sonnet-20250219': 'claude-3-7-sonnet',
    'anthropic/claude-3-7-sonnet-20250219:thinking': 'claude-3-7-sonnet',
    'anthropic/claude-4-sonnet-20250522': 'claude-sonnet-4-6',
    'anthropic/claude-4.5-sonnet': 'claude-sonnet-4-6',
    'anthropic/claude-4.6-sonnet-20260217': 'claude-sonnet-4-6',
    'anthropic/claude-4-opus-20250522': 'claude-opus-4-6',
    'anthropic/claude-4.1-opus': 'claude-opus-4-6',
    'anthropic/claude-4.6-opus-20260205': 'claude-opus-4-6',
    'openai/gpt-4o': 'gpt-4o',
    'openai/gpt-4o-mini': 'gpt-4o',
    'openai/gpt-5': 'gpt-5-4',
    'openai/gpt-5-chat': 'gpt-5-4',
    'google/gemini-2.5-pro-preview': 'gemini-2-5-pro',
    'google/gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro',
    'google/gemini-2.5-pro-preview-06-05': 'gemini-2-5-pro',
    'google/gemini-2.5-pro-exp-03-25': 'gemini-2-5-pro',
    'google/gemini-2.5-pro-exp-03-25:free': 'gemini-2-5-pro',
    'google/gemini-2.5-flash-preview': 'gemini-2-5-flash',
    'google/gemini-2.5-flash-preview-04-17': 'gemini-2-5-flash',
    'google/gemini-2.5-flash-preview-04-17:thinking': 'gemini-2-5-flash',
    'google/gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash',
    'google/gemini-2.0-flash-001': 'gemini-2-5-flash',
    'google/gemini-3.1-pro': 'gemini-3-1-pro',
    'google/gemini-3-flash-preview-20251217': 'gemini-3-1-pro',
    'deepseek/deepseek-r1': 'deepseek-r1',
    'deepseek/deepseek-r1:free': 'deepseek-r1',
    'deepseek/deepseek-chat-v3-0324': 'deepseek-v3',
    'deepseek/deepseek-chat-v3-0324:free': 'deepseek-v3',
    'deepseek/deepseek-v3.2-20251201': 'deepseek-v3',
    'x-ai/grok-4': 'grok-4',
    'xai/grok-4': 'grok-4',
    'qwen/qwen3-max': 'qwen3-max',
    'meta-llama/llama-4-maverick': 'llama-4-maverick',
    'mistralai/mistral-medium-3': 'mistral-medium-3',
    'stepfun/step-3.5-flash:free': 'stepfun-flash',
    'z-ai/glm-5-turbo-20260315': 'glm-5-turbo',
    'xiaomi/mimo-v2-pro-20260318': 'mimo-v2-pro',
    'openrouter/hunter-alpha': 'openrouter-hunter-alpha',
    'openrouter/optimus-alpha': 'openrouter-optimus-alpha',
}


def extract_openrouter_timeseries(html: str):
    m = re.search(r'self\.__next_f\.push\(\[1,"(43:.*?)"\]\)</script>', html)
    if not m:
        raise RuntimeError('Could not locate OpenRouter rankings flight payload')

    payload = codecs.decode(m.group(1), 'unicode_escape')
    marker = '{"data":['
    marker_idx = payload.find(marker)
    if marker_idx == -1:
        raise RuntimeError('Could not find data array in decoded flight payload')

    array_start = payload.find('[', marker_idx)
    depth = 0
    in_str = False
    escape = False
    for idx in range(array_start, len(payload)):
        ch = payload[idx]
        if in_str:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                return json.loads(payload[array_start:idx + 1])

    raise RuntimeError('Failed to parse rankings data array from payload')


def slug_to_fallback_key(slug: str) -> str:
    return 'or_' + re.sub(r'[^a-z0-9]+', '-', slug.lower()).strip('-')[:80]


def main():
    html = requests.get(URL, headers={'User-Agent': UA}, timeout=30).text
    data = extract_openrouter_timeseries(html)
    latest = data[-1]
    ys = latest['ys']
    sorted_models = sorted(((slug, value) for slug, value in ys.items() if slug != 'Others'), key=lambda x: x[1], reverse=True)

    rows = []
    unmapped = []
    seen = set()
    rank = 0
    for slug, value in sorted_models:
        rank += 1
        model_key = ALIASES.get(slug)
        if model_key:
            if model_key in seen:
                continue
            seen.add(model_key)
            rows.append((model_key, rank))
        else:
            fallback = slug_to_fallback_key(slug)
            if fallback in seen:
                continue
            seen.add(fallback)
            rows.append((fallback, rank))
            unmapped.append((fallback, slug, rank, value))

    with OUT.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['key', 'rank'])
        writer.writerows(rows)

    with UNMAPPED_OUT.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['fallback_key', 'slug', 'rank', 'value'])
        writer.writerows(unmapped)

    print(f'Latest datapoint date: {latest["x"]}')
    print(f'Wrote {len(rows)} total rows to {OUT}')
    print(f'Unmapped fallback rows: {len(unmapped)} -> {UNMAPPED_OUT}')
    print('Top mapped/fallback models:')
    for key, rank in rows[:15]:
        print(f'  #{rank}: {key}')


if __name__ == '__main__':
    main()
