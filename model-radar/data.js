window.MODEL_RADAR_DATA = {
  "weights": {
    "openrouter": 0.4,
    "lmsys": 0.2,
    "artificial": 0.25,
    "opencompass": 0.15
  },
  "sourceMeta": {
    "openrouter": {
      "label": "OpenRouter Rankings",
      "description": "Ecosystem popularity and developer usage trends",
      "url": "https://openrouter.ai/rankings"
    },
    "lmsys": {
      "label": "LMSYS Arena",
      "description": "Human preference and head-to-head quality signals",
      "url": "https://lmarena.ai/"
    },
    "artificial": {
      "label": "Artificial Analysis",
      "description": "Composite quality, speed, and value reference",
      "url": "https://artificialanalysis.ai/"
    },
    "opencompass": {
      "label": "OpenCompass",
      "description": "Benchmark-oriented evaluation coverage",
      "url": "https://rank.opencompass.org.cn/"
    }
  },
  "models": [
    {
      "key": "claude-3-7-sonnet",
      "name": "Claude 3.7 Sonnet",
      "provider": "Anthropic",
      "category": "reasoning",
      "supportStatus": "supported",
      "capabilityScore": 94,
      "businessScore": 91,
      "recommendedFor": [
        "coding",
        "reasoning",
        "agents"
      ],
      "notes": "Strong coding model with stable demand across dev workflows.",
      "ranks": {
        "lmsys": 5,
        "artificial": 4,
        "opencompass": 12
      }
    },
    {
      "key": "gpt-4o",
      "name": "GPT-4o / GPT-4o mini",
      "provider": "OpenAI",
      "category": "flagship",
      "supportStatus": "supported",
      "capabilityScore": 90,
      "businessScore": 95,
      "recommendedFor": [
        "chat",
        "vision",
        "agents"
      ],
      "notes": "Mainstream default choice with strong brand pull and broad compatibility.",
      "ranks": {
        "lmsys": 8,
        "artificial": 6,
        "opencompass": 15
      }
    },
    {
      "key": "gemini-2-5-pro",
      "name": "Gemini 2.5 Pro",
      "provider": "Google",
      "category": "reasoning",
      "supportStatus": "supported",
      "capabilityScore": 92,
      "businessScore": 87,
      "recommendedFor": [
        "reasoning",
        "long-context",
        "analysis"
      ],
      "notes": "High-end reasoning and context window coverage.",
      "ranks": {
        "lmsys": 4,
        "artificial": 5,
        "opencompass": 9
      }
    },
    {
      "key": "gemini-2-5-flash",
      "name": "Gemini Flash family",
      "provider": "Google",
      "category": "fast",
      "supportStatus": "supported",
      "capabilityScore": 84,
      "businessScore": 86,
      "recommendedFor": [
        "speed",
        "cheap",
        "chatbots"
      ],
      "notes": "Fast and low-cost option for high-volume chat tasks.",
      "ranks": {
        "lmsys": 14,
        "artificial": 8,
        "opencompass": 22
      }
    },
    {
      "key": "deepseek-r1",
      "name": "DeepSeek R1",
      "provider": "DeepSeek",
      "category": "reasoning",
      "supportStatus": "supported",
      "capabilityScore": 91,
      "businessScore": 88,
      "recommendedFor": [
        "reasoning",
        "coding",
        "value"
      ],
      "notes": "Very strong value story and high interest from price-sensitive users.",
      "ranks": {
        "lmsys": 11,
        "artificial": 9,
        "opencompass": 4
      }
    },
    {
      "key": "deepseek-v3",
      "name": "DeepSeek V3 / V3.2",
      "provider": "DeepSeek",
      "category": "flagship",
      "supportStatus": "supported",
      "capabilityScore": 86,
      "businessScore": 89,
      "recommendedFor": [
        "cheap",
        "general",
        "coding"
      ],
      "notes": "Strong usage momentum on OpenRouter with excellent price-to-performance optics.",
      "ranks": {
        "openrouter": 4,
        "lmsys": 18,
        "artificial": 13,
        "opencompass": 8
      }
    },
    {
      "key": "claude-sonnet-4-6",
      "name": "Claude Sonnet 4.6",
      "provider": "Anthropic",
      "category": "flagship",
      "supportStatus": "supported",
      "capabilityScore": 95,
      "businessScore": 90,
      "recommendedFor": [
        "coding",
        "writing",
        "agents"
      ],
      "notes": "Premium high-quality default for coding and writing.",
      "ranks": {
        "openrouter": 5,
        "lmsys": 6,
        "artificial": 3,
        "opencompass": 10
      }
    },
    {
      "key": "claude-opus-4-6",
      "name": "Claude Opus 4.6",
      "provider": "Anthropic",
      "category": "flagship",
      "supportStatus": "supported",
      "capabilityScore": 97,
      "businessScore": 84,
      "recommendedFor": [
        "quality",
        "coding",
        "research"
      ],
      "notes": "Prestige flagship model for best-quality positioning.",
      "ranks": {
        "openrouter": 8,
        "lmsys": 3,
        "artificial": 2,
        "opencompass": 7
      }
    },
    {
      "key": "grok-4",
      "name": "Grok 4",
      "provider": "xAI",
      "category": "reasoning",
      "supportStatus": "watchlist",
      "capabilityScore": 90,
      "businessScore": 76,
      "recommendedFor": [
        "reasoning",
        "news"
      ],
      "notes": "Attention-grabbing model; watch demand before prioritizing full exposure.",
      "ranks": {
        "lmsys": 7,
        "artificial": 7,
        "opencompass": 18
      }
    },
    {
      "key": "qwen3-max",
      "name": "Qwen3-Max",
      "provider": "Qwen",
      "category": "flagship",
      "supportStatus": "watchlist",
      "capabilityScore": 89,
      "businessScore": 79,
      "recommendedFor": [
        "multilingual",
        "coding",
        "value"
      ],
      "notes": "Strong Asia-focused coverage and pricing angle.",
      "ranks": {
        "lmsys": 10,
        "artificial": 11,
        "opencompass": 5
      }
    },
    {
      "key": "llama-4-maverick",
      "name": "Llama 4 Maverick",
      "provider": "Meta",
      "category": "open",
      "supportStatus": "watchlist",
      "capabilityScore": 82,
      "businessScore": 68,
      "recommendedFor": [
        "open-source",
        "experimentation"
      ],
      "notes": "Useful ecosystem anchor for open-source model coverage.",
      "ranks": {
        "lmsys": 16,
        "artificial": 16,
        "opencompass": 20
      }
    },
    {
      "key": "mistral-medium-3",
      "name": "Mistral Medium 3",
      "provider": "Mistral",
      "category": "flagship",
      "supportStatus": "watchlist",
      "capabilityScore": 81,
      "businessScore": 66,
      "recommendedFor": [
        "europe",
        "general"
      ],
      "notes": "Worth keeping on radar, but not a top acquisition driver yet.",
      "ranks": {
        "lmsys": 22,
        "artificial": 17,
        "opencompass": 24
      }
    },
    {
      "key": "gemini-3-1-pro",
      "name": "Gemini 3.1 Pro",
      "provider": "Google",
      "category": "flagship",
      "supportStatus": "candidate",
      "capabilityScore": 95,
      "businessScore": 84,
      "recommendedFor": [
        "latest",
        "reasoning",
        "long-context"
      ],
      "notes": "New flagship; candidate for prominent support and content push.",
      "ranks": {
        "openrouter": 9,
        "lmsys": 2,
        "artificial": 1,
        "opencompass": 6
      }
    },
    {
      "key": "gpt-5-4",
      "name": "GPT-5.4",
      "provider": "OpenAI",
      "category": "flagship",
      "supportStatus": "candidate",
      "capabilityScore": 96,
      "businessScore": 92,
      "recommendedFor": [
        "flagship",
        "coding",
        "agents"
      ],
      "notes": "Important for flagship positioning and demand capture.",
      "ranks": {
        "lmsys": 1,
        "artificial": 10,
        "opencompass": 13
      }
    },
    {
      "key": "stepfun-flash",
      "name": "Stepfun / Step 3.5 Flash",
      "provider": "Stepfun",
      "category": "fast",
      "supportStatus": "watchlist",
      "capabilityScore": 78,
      "businessScore": 72,
      "recommendedFor": [
        "cheap",
        "chat",
        "china"
      ],
      "notes": "Fast-rising traffic signal on OpenRouter; worth watching for demand.",
      "ranks": {
        "openrouter": 1
      }
    },
    {
      "key": "glm-5-turbo",
      "name": "GLM-5 Turbo",
      "provider": "Z.ai",
      "category": "fast",
      "supportStatus": "watchlist",
      "capabilityScore": 80,
      "businessScore": 74,
      "recommendedFor": [
        "cheap",
        "multilingual",
        "china"
      ],
      "notes": "Could become useful if Chinese-market demand continues rising.",
      "ranks": {
        "openrouter": 6
      }
    },
    {
      "key": "mimo-v2-pro",
      "name": "Xiaomi MiMo V2 Pro",
      "provider": "Xiaomi",
      "category": "reasoning",
      "supportStatus": "candidate",
      "capabilityScore": 88,
      "businessScore": 82,
      "recommendedFor": [
        "reasoning",
        "new-model",
        "seo"
      ],
      "notes": "Fresh model with strong novelty and content marketing value.",
      "ranks": {
        "openrouter": 3
      }
    },
    {
      "key": "openrouter-hunter-alpha",
      "name": "OpenRouter Hunter Alpha",
      "provider": "OpenRouter",
      "category": "fast",
      "supportStatus": "watchlist",
      "capabilityScore": 77,
      "businessScore": 69,
      "recommendedFor": [
        "cheap",
        "routing",
        "experiments"
      ],
      "notes": "Internal OpenRouter ecosystem signal; monitor rather than feature.",
      "ranks": {
        "openrouter": 7
      }
    },
    {
      "key": "openrouter-optimus-alpha",
      "name": "OpenRouter Optimus Alpha",
      "provider": "OpenRouter",
      "category": "flagship",
      "supportStatus": "watchlist",
      "capabilityScore": 79,
      "businessScore": 70,
      "recommendedFor": [
        "routing",
        "experiments"
      ],
      "notes": "Good market-signal model, but less critical than major provider flagships.",
      "ranks": {}
    },
    {
      "key": "or_minimax-minimax-m2-5-20260211",
      "name": "Minimax M2 5 20260211",
      "provider": "MiniMax",
      "category": "fast",
      "supportStatus": "watchlist",
      "capabilityScore": 72,
      "businessScore": 60,
      "recommendedFor": [
        "watchlist",
        "new-model"
      ],
      "notes": "Auto-imported from OpenRouter rankings: minimax/minimax-m2.5-20260211",
      "ranks": {
        "openrouter": 2
      }
    }
  ]
};
