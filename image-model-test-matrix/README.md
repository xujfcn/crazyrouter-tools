# Image Model Test Matrix

A small CLI for comparing multiple AI image generation models through an OpenAI-compatible image API.

It helps you test the same prompt across GPT Image, Qwen Image, FLUX, Imagen-style model routes, then write a Markdown scoring matrix.

## Usage

```bash
export CRAZYROUTER_API_KEY=sk-...
python image_model_test_matrix.py \
  --prompt "Create a clean SaaS hero image for an AI API dashboard..." \
  --models gpt-image-1,qwen-image,flux-pro,imagen \
  --output results.md \
  --json-output results.json
```

Dry-run/template mode:

```bash
python image_model_test_matrix.py --dry-run --output example_matrix.md
```

## Endpoint

Default endpoint:

```text
https://crazyrouter.com/v1/images/generations
```

Do not add UTM parameters to API endpoints. Use UTM only for human-facing pages and articles.

## What to score

- Prompt following
- Visual quality
- Text accuracy
- Brand fit
- Accepted output rate
- Cost per accepted image

The cheapest raw generation is not always the cheapest production model. A model that produces usable images more consistently can win even when each request costs more.
