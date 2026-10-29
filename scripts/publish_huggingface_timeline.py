"""Publish an allowlisted static export using HF_TOKEN from the environment."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re

import httpx
import requests
from huggingface_hub import HfApi, set_client_factory

REPO = 'xujfcn/Crazyrouter-Model-Timeline'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--folder', required=True, type=Path)
    parser.add_argument('--record', required=True, type=Path)
    parser.add_argument('--proxy')
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    token = os.environ.get('HF_TOKEN', '').strip()
    if not token:
        raise RuntimeError('Set HF_TOKEN in the environment')
    folder = args.folder.resolve()
    manifest = json.loads((folder / 'build-manifest.json').read_text(encoding='utf-8'))
    if manifest['repo'] != REPO:
        raise RuntimeError('Export target does not match this publisher')
    paths = list(manifest['files']) + ['build-manifest.json']
    for name in paths:
        path = (folder / name).resolve()
        if not path.is_relative_to(folder) or not path.is_file():
            raise RuntimeError('Invalid export path')
        content = path.read_bytes()
        if token.encode() in content or re.search(rb'(?:hf_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})', content):
            raise RuntimeError(f'Credential-like content in {name}')
        if name in manifest['files'] and hashlib.sha256(content).hexdigest() != manifest['files'][name]:
            raise RuntimeError(f'Export changed after build: {name}')
    session = requests.Session()
    session.trust_env = False
    if args.proxy:
        session.proxies.update(http=args.proxy, https=args.proxy)
    session.headers['Authorization'] = f'Bearer {token}'

    def api(method, path, **kwargs):
        response = session.request(method, 'https://huggingface.co' + path, timeout=60, **kwargs)
        if not response.ok:
            raise RuntimeError(f'Hugging Face API returned {response.status_code} for {path}')
        return response.json()

    identity = api('GET', '/api/whoami-v2')
    if identity['name'] != REPO.split('/')[0]:
        raise RuntimeError('Authenticated account does not match the Space owner')
    existing = session.get(f'https://huggingface.co/api/spaces/{REPO}', timeout=40)
    if existing.status_code not in (200, 404):
        raise RuntimeError(f'Cannot inspect target Space: HTTP {existing.status_code}')
    print(json.dumps({'account': identity['name'], 'repo': REPO, 'exists': existing.status_code == 200, 'files': len(paths)}), flush=True)
    if not args.publish:
        return
    parent = None
    if existing.status_code == 404:
        api('POST', '/api/repos/create', json={
            'type': 'space', 'name': REPO.split('/')[1], 'organization': REPO.split('/')[0],
            'private': False, 'sdk': 'static',
        })
    else:
        info = existing.json()
        if info.get('sdk') != 'static':
            raise RuntimeError('The existing target is not a static Space')
        parent = info['sha']
    set_client_factory(lambda: httpx.Client(proxy=args.proxy, trust_env=False, timeout=60, follow_redirects=True))
    result = HfApi(token=token).upload_folder(
        repo_id=REPO, repo_type='space', folder_path=folder, allow_patterns=paths,
        parent_commit=parent, commit_message='Publish six-language model timeline with reciprocal Crazyrouter links',
    )
    info = api('GET', f'/api/spaces/{REPO}')
    record = {
        'repo': REPO, 'url': f'https://huggingface.co/spaces/{REPO}',
        'host': info.get('host'), 'runtime': info.get('runtime'), 'commit': result.oid,
        'sourceCommit': manifest['sourceCommit'], 'asOf': manifest['asOf'], 'files': paths,
    }
    args.record.parent.mkdir(parents=True, exist_ok=True)
    args.record.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(record), flush=True)


if __name__ == '__main__':
    main()
