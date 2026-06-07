#!/usr/bin/env python3
"""Test multiple AI image models through an OpenAI-compatible image API and write a Markdown/JSON matrix.

Default endpoint is Crazyrouter's OpenAI-compatible image generation endpoint.

Examples:
  export CRAZYROUTER_API_KEY=sk-...
  python tools/image/image_model_test_matrix.py \
    --prompt "Create a clean SaaS hero image..." \
    --models gpt-image-1,qwen-image,flux-pro,imagen \
    --output generated/image_model_matrix_20260607/results.md

Dry-run/template mode:
  python tools/image/image_model_test_matrix.py --dry-run --output generated/image_model_matrix_20260607/template.md
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any

import requests

DEFAULT_ENDPOINT = "https://crazyrouter.com/v1/images/generations"
DEFAULT_MODELS = ["gpt-image-1", "qwen-image", "flux-pro", "imagen"]
DEFAULT_PROMPT = (
    "Create a clean SaaS hero image for an AI API dashboard. Show multiple model cards "
    "connected to one central API key, subtle blue and purple gradients, modern UI panels, "
    "no brand logos, professional developer-tool style."
)


def now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def call_image_api(endpoint: str, api_key: str, model: str, prompt: str, size: str, n: int, timeout: int) -> dict[str, Any]:
    started = time.time()
    payload = {"model": model, "prompt": prompt, "size": size, "n": n}
    r = requests.post(
        endpoint,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
    )
    latency = time.time() - started
    rec: dict[str, Any] = {
        "model": model,
        "status_code": r.status_code,
        "latency_sec": round(latency, 2),
        "ok": 200 <= r.status_code < 300,
    }
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text[:1000]}
    if rec["ok"]:
        urls = []
        for item in body.get("data", []) if isinstance(body, dict) else []:
            if isinstance(item, dict):
                urls.append(item.get("url") or item.get("b64_json", "")[:80])
        rec["outputs"] = [u for u in urls if u]
        rec["raw_keys"] = sorted(body.keys()) if isinstance(body, dict) else []
    else:
        rec["error"] = body
    return rec


def score_hint(model: str) -> str:
    m = model.lower()
    if "qwen" in m:
        return "Text-heavy posters, bilingual assets, practical UI/marketing images"
    if "flux" in m:
        return "Stylized hero images, social posters, creative visual direction"
    if "imagen" in m:
        return "Photorealistic product/marketing images and natural lighting"
    if "gpt" in m or "dall" in m:
        return "Instruction following, structured scenes, edits, product mockups"
    return "Custom model; score prompt following, visual quality, accepted-output cost"


def write_markdown(path: Path, prompt: str, endpoint: str, size: str, rows: list[dict[str, Any]], dry_run: bool) -> None:
    lines = []
    lines.append("# AI Image Model Test Matrix")
    lines.append("")
    lines.append(f"Generated: {now()}")
    lines.append(f"Mode: {'dry-run/template' if dry_run else 'live API test'}")
    lines.append("")
    lines.append("## Test prompt")
    lines.append("")
    lines.append("```text")
    lines.append(prompt)
    lines.append("```")
    lines.append("")
    lines.append("## API endpoint")
    lines.append("")
    lines.append("```text")
    lines.append(endpoint)
    lines.append("```")
    lines.append("")
    lines.append("## Matrix")
    lines.append("")
    lines.append("| Model | Status | Latency | Output | Best-use hint | Prompt following | Visual quality | Text accuracy | Brand fit | Accepted? | Notes |")
    lines.append("|---|---:|---:|---|---|---:|---:|---:|---:|---|---|")
    for r in rows:
        output = ""
        if r.get("outputs"):
            output = str(r["outputs"][0])[:120]
        elif r.get("error"):
            output = "error"
        status = r.get("status_code", "template")
        latency = r.get("latency_sec", "")
        lines.append(
            f"| {r['model']} | {status} | {latency} | {output} | {score_hint(r['model'])} |  |  |  |  |  |  |"
        )
    lines.append("")
    lines.append("## Scoring guide")
    lines.append("")
    lines.append("Score each model from 1-5 for prompt following, visual quality, text accuracy, and brand fit. The production winner is usually the model with the lowest cost per accepted image, not the lowest cost per raw generation.")
    lines.append("")
    lines.append("## Production request template")
    lines.append("")
    lines.append("```bash")
    lines.append("curl https://crazyrouter.com/v1/images/generations \\")
    lines.append("  -H \"Authorization: Bearer $CRAZYROUTER_API_KEY\" \\")
    lines.append("  -H \"Content-Type: application/json\" \\")
    lines.append("  -d '{")
    lines.append(f"    \"model\": \"{rows[0]['model'] if rows else DEFAULT_MODELS[0]}\",")
    lines.append("    \"prompt\": \"...\",")
    lines.append(f"    \"size\": \"{size}\",")
    lines.append("    \"n\": 1")
    lines.append("  }'")
    lines.append("```")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    ap.add_argument("--api-key", default=os.getenv("CRAZYROUTER_API_KEY"))
    ap.add_argument("--models", default=",".join(DEFAULT_MODELS), help="Comma-separated model IDs")
    ap.add_argument("--prompt", default=DEFAULT_PROMPT)
    ap.add_argument("--size", default="1024x1024")
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--timeout", type=int, default=90)
    ap.add_argument("--dry-run", action="store_true", help="Write a scoring template without calling the API")
    ap.add_argument("--output", default="generated/image_model_matrix_20260607/image_model_test_matrix.md")
    ap.add_argument("--json-output", default="")
    args = ap.parse_args()

    models = [m.strip() for m in args.models.split(",") if m.strip()]
    rows: list[dict[str, Any]] = []
    if args.dry_run or not args.api_key:
        rows = [{"model": m, "status_code": "template", "latency_sec": ""} for m in models]
    else:
        for model in models:
            rows.append(call_image_api(args.endpoint, args.api_key, model, args.prompt, args.size, args.n, args.timeout))

    out = Path(args.output)
    write_markdown(out, args.prompt, args.endpoint, args.size, rows, args.dry_run or not args.api_key)
    if args.json_output:
        Path(args.json_output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.json_output).write_text(json.dumps({"generated_at": now(), "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
