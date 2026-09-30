"""Publish only built static assets. Supply a write-scoped HF_TOKEN in the environment."""
import os, re
from pathlib import Path
from huggingface_hub import HfApi

root=Path(__file__).resolve().parents[1]
folder=root/'dist'
token=os.environ['HF_TOKEN']
if not (folder/'index.html').exists() or 'sdk: static' not in (folder/'README.md').read_text():
    raise RuntimeError('Run npm run build first')
for file in folder.rglob('*'):
    if file.is_file():
        data=file.read_bytes()
        if token.encode() in data or re.search(rb'(?:hf_[A-Za-z0-9]{25,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})',data):
            raise RuntimeError('Credential-like content in build')
repo='xujfcn/Crazyrouter-Tokenizer-Comparison'
api=HfApi(token=token)
info=api.space_info(repo)
if info.sdk!='static':raise RuntimeError('Expected an existing Static Space')
commit=api.upload_folder(repo_id=repo,repo_type='space',folder_path=folder,parent_commit=info.sha,commit_message='Sync tested tokenizer static build from GitHub source')
print(commit.commit_url)
