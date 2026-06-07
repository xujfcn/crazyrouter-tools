# AI Image Model Test Matrix

Generated: 2026-06-07T09:06:18Z
Mode: dry-run/template

## Test prompt

```text
Create a clean SaaS hero image for an AI API dashboard. Show multiple model cards connected to one central API key, subtle blue and purple gradients, modern UI panels, no brand logos, professional developer-tool style.
```

## API endpoint

```text
https://crazyrouter.com/v1/images/generations
```

## Matrix

| Model | Status | Latency | Output | Best-use hint | Prompt following | Visual quality | Text accuracy | Brand fit | Accepted? | Notes |
|---|---:|---:|---|---|---:|---:|---:|---:|---|---|
| gpt-image-1 | template |  |  | Instruction following, structured scenes, edits, product mockups |  |  |  |  |  |  |
| qwen-image | template |  |  | Text-heavy posters, bilingual assets, practical UI/marketing images |  |  |  |  |  |  |
| flux-pro | template |  |  | Stylized hero images, social posters, creative visual direction |  |  |  |  |  |  |
| imagen | template |  |  | Photorealistic product/marketing images and natural lighting |  |  |  |  |  |  |

## Scoring guide

Score each model from 1-5 for prompt following, visual quality, text accuracy, and brand fit. The production winner is usually the model with the lowest cost per accepted image, not the lowest cost per raw generation.

## Production request template

```bash
curl https://crazyrouter.com/v1/images/generations \
  -H "Authorization: Bearer $CRAZYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-1",
    "prompt": "...",
    "size": "1024x1024",
    "n": 1
  }'
```
