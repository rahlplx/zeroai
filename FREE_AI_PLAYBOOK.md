# 🆓 The Complete Free AI Playbook

## How to Get Unlimited AI Usage for $0.00

---

## 🏆 The Free AI Stack (No Credit Card, Permanent)

### Tier 1: Must-Have (Setup First)

| # | Provider | Free Models | Rate Limit | Signup URL | Env Var |
|---|----------|-------------|------------|------------|---------|
| 1 | **Google AI Studio** | Gemini 2.5 Flash, 2.5 Pro, Flash-Lite | 15 RPM / 1,500 RPD | https://aistudio.google.com/apikey | `GOOGLE_AI_API_KEY` |
| 2 | **Groq** | Llama 3.3 70B, Qwen3 32B, Kimi K2 | 30 RPM / 14,400 RPD | https://console.groq.com | `GROQ_API_KEY` |
| 3 | **Mistral** | Mistral Large, Codestral, Small | ~1B tok/mo | https://console.mistral.ai | `MISTRAL_API_KEY` |

### Tier 2: Expand Your Options

| # | Provider | Free Models | Rate Limit | Signup URL | Env Var |
|---|----------|-------------|------------|------------|---------|
| 4 | **Cerebras** | Llama 3.3 70B, Qwen 2.5 32B | 1.5M tok/day | https://cloud.cerebras.ai | `CEREBRAS_API_KEY` |
| 5 | **OpenRouter** | 27+ free models (DeepSeek, Llama, Qwen, Nemotron) | 20 RPM / 50 RPD | https://openrouter.ai | `OPENROUTER_API_KEY` |
| 6 | **DeepSeek** | DeepSeek V3, R1 | 5M free signup tokens | https://platform.deepseek.com | `DEEPSEEK_API_KEY` |

### Tier 3: Extra / Specialized

| # | Provider | Free Models | Rate Limit | Signup URL |
|---|----------|-------------|------------|------------|
| 7 | **Cohere** | Command R+ (128K ctx) | 1,000 calls/mo | https://dashboard.cohere.com |
| 8 | **HuggingFace** | 100+ community models | ~few hundred/hr | https://huggingface.co/settings/tokens |
| 9 | **Cloudflare** | Llama, Mistral, Qwen on edge | 10K neurons/day | https://dash.cloudflare.com |

### Tier 4: Unlimited Local (Your Hardware)

| # | Provider | Free Models | Rate Limit | Install |
|---|----------|-------------|------------|---------|
| 10 | **Ollama** | Any model, unlimited | Unlimited | https://ollama.com |

---

## 🚀 Quick Start (5 Minutes to Free AI)

### Step 1: Get Your Free API Keys (3 minutes)

```bash
# Open these in your browser and click "Get API Key" / "Create Key"
# All are free. None require a credit card.

# 1. Google AI Studio → Best free API
open https://aistudio.google.com/apikey

# 2. Groq → Fastest inference
open https://console.groq.com

# 3. Mistral → Most generous quota
open https://console.mistral.ai
```

### Step 2: Set Environment Variables (1 minute)

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOOGLE_AI_API_KEY="paste-your-key-here"
export GROQ_API_KEY="paste-your-key-here"
export MISTRAL_API_KEY="paste-your-key-here"

# Reload
source ~/.bashrc
```

### Step 3: Start Using (1 minute)

```bash
# Option A: Gemini CLI (official, free)
npm install -g @google/gemini-cli
gemini "Explain quantum computing"

# Option B: Direct API call (any provider)
# Gemini
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GOOGLE_AI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Groq (OpenAI-compatible — works with any OpenAI SDK!)
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Hello"}]}'

# Mistral
curl https://api.mistral.ai/v1/chat/completions \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-large-latest","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 💻 Using with OpenAI SDK (Drop-In Replacement)

Every provider except Gemini uses the OpenAI-compatible API format. Just change `base_url`:

### Python (OpenAI SDK)

```python
import os
from openai import OpenAI

# ─── Groq (fastest, free) ──────────────────────
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Write a Python web scraper"}],
)

# ─── Cerebras (ultra-fast, free) ───────────────
client = OpenAI(
    base_url="https://api.cerebras.ai/v1",
    api_key=os.environ["CEREBRAS_API_KEY"],
)

# ─── OpenRouter (27+ free models) ──────────────
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
)
response = client.chat.completions.create(
    model="deepseek/deepseek-chat:free",  # Note the :free suffix
    messages=[{"role": "user", "content": "Hello"}],
)

# ─── DeepSeek (frontier reasoning, free) ───────
client = OpenAI(
    base_url="https://api.deepseek.com/v1",
    api_key=os.environ["DEEPSEEK_API_KEY"],
)

# ─── Ollama (local, unlimited) ─────────────────
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # Any string works
)
```

### JavaScript/TypeScript

```javascript
import OpenAI from 'openai';

// ─── Groq ─────────────────────────────────────
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// ─── Cerebras ─────────────────────────────────
const cerebras = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY,
});

// ─── Ollama (local) ───────────────────────────
const ollama = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});
```

---

## 🧠 Smart Routing: Which Free Provider for Which Task?

| Task | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|------|---------|------------|------------|------------|
| **Coding** | Groq (Llama 70B) | Mistral (Codestral) | Gemini (2.5 Pro) | Ollama |
| **Reasoning** | Gemini (2.5 Pro) | DeepSeek (R1) | OpenRouter (Qwen3 235B) | Ollama |
| **Fast chat** | Groq (Llama 8B) | Cerebras (Llama 70B) | Groq (Qwen3) | Ollama |
| **Long context** | Gemini (1M ctx) | OpenRouter (Llama 4 Scout) | Mistral (256K) | Ollama |
| **Vision** | Gemini (2.5 Flash) | Ollama (Llama 3.2 Vision) | — | — |
| **Image gen** | Gemini (2.5 Flash Image) | — | — | — |
| **Tool calling** | Groq (Llama 70B) | Gemini (2.5 Flash) | Cohere (R+) | Ollama |
| **Privacy** | Ollama (local) | — | — | — |

---

## 🏗️ MCP Server Setup (For Claude Code / Cursor)

### Method 1: Official Gemini CLI as MCP

```json
// ~/.claude/mcp.json or ~/.cursor/mcp.json
{
  "mcpServers": {
    "gemini": {
      "command": "gemini",
      "args": ["--mcp"],
      "env": {
        "GEMINI_API_KEY": "your-key"
      }
    }
  }
}
```

### Method 2: Free AI MCP Server (multi-provider)

```json
{
  "mcpServers": {
    "free-ai": {
      "command": "npx",
      "args": ["free-ai-cli", "serve"],
      "env": {
        "GOOGLE_AI_API_KEY": "...",
        "GROQ_API_KEY": "...",
        "MISTRAL_API_KEY": "...",
        "CEREBRAS_API_KEY": "...",
        "OPENROUTER_API_KEY": "...",
        "DEEPSEEK_API_KEY": "..."
      }
    }
  }
}
```

### Method 3: Gemini Web (Cookie-based, no API key)

```json
{
  "mcpServers": {
    "gemini-web": {
      "command": "npx",
      "args": ["-y", "gemini-webapi-mcp"],
      "env": {
        "GEMINI_PSID": "...",
        "GEMINI_PSIDTS": "..."
      }
    }
  }
}
```

---

## 🔄 Rate Limit Multiplication Strategy

The key insight: **stack multiple free providers and rotate between them**.

| Combined Stack | Effective Rate Limit | Total Daily Tokens (approx) |
|---|---|---|
| Google + Groq + Mistral | 55 RPM / 500K+ RPD | ~50M tokens/day |
| + Cerebras + OpenRouter | 105 RPM / 510K+ RPD | ~75M tokens/day |
| + DeepSeek + Cohere | 225 RPM / 540K+ RPD | ~100M tokens/day |
| + Ollama (local) | **Unlimited** fallback | **∞** |

### Rotation Pattern:

```python
import itertools
from openai import OpenAI

# Define all free providers
PROVIDERS = [
    {"base_url": "https://api.groq.com/openai/v1", "api_key": os.environ["GROQ_API_KEY"], "model": "llama-3.3-70b-versatile"},
    {"base_url": "https://api.cerebras.ai/v1", "api_key": os.environ["CEREBRAS_API_KEY"], "model": "llama-3.3-70b"},
    {"base_url": "https://api.mistral.ai/v1", "api_key": os.environ["MISTRAL_API_KEY"], "model": "mistral-large-latest"},
    {"base_url": "https://openrouter.ai/api/v1", "api_key": os.environ["OPENROUTER_API_KEY"], "model": "deepseek/deepseek-chat:free"},
]

# Round-robin through providers
provider_cycle = itertools.cycle(PROVIDERS)

def free_chat(prompt: str, retries: int = 3) -> str:
    """Chat with free AI, automatically rotating providers on rate limit."""
    for _ in range(retries * len(PROVIDERS)):
        provider = next(provider_cycle)
        try:
            client = OpenAI(base_url=provider["base_url"], api_key=provider["api_key"])
            response = client.chat.completions.create(
                model=provider["model"],
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                continue  # Try next provider
            raise
    raise Exception("All free providers hit rate limits. Wait a minute and retry.")
```

---

## 🏠 Local AI: Truly Unlimited (Ollama Setup)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models (one-time download)
ollama pull qwen3:8b          # Fast, good quality (~5GB)
ollama pull qwen3:32b         # Great quality (~20GB)
ollama pull llama3.3:70b      # Best quality (~40GB, needs 32GB RAM)
ollama pull deepseek-r1:70b   # Best reasoning (~40GB)
ollama pull codestral:22b     # Best coding (~13GB)

# Use from terminal
ollama run qwen3:8b "Write a Python web scraper"

# Use as OpenAI-compatible API (any SDK works!)
# API available at http://localhost:11434/v1

# Add Open WebUI for ChatGPT-like interface
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data --name open-webui \
  --restart always ghcr.io/open-webui/open-webui:main
```

---

## 💰 Cost Comparison: Free vs Paid

| Usage Level | Free Stack | OpenAI API | Anthropic API |
|---|---|---|---|
| 1K messages/day | **$0** | ~$30-60/mo | ~$40-80/mo |
| 10K messages/day | **$0** | ~$300-600/mo | ~$400-800/mo |
| 100K messages/day | **$0** (rotate) | ~$3,000-6,000/mo | ~$4,000-8,000/mo |
| Unlimited | **$0** (Ollama) | ~$10,000+/mo | ~$15,000+/mo |

**Annual savings with free stack: $360 - $180,000+**

---

## ⚠️ Important Notes

1. **Free tier data may be used for training** — Don't send sensitive data to Google/Groq/OpenRouter free tiers.
2. **Rate limits are per-account** — Creating multiple accounts violates ToS.
3. **Use Ollama for sensitive work** — Completely private, no data leaves your machine.
4. **DeepSeek is based in China** — Consider data privacy implications.
5. **Google free tier not available in EU/EEA** — Use VPN or other providers.
6. **Rate limits can change** — The numbers above are current as of June 2026.
7. **Stack multiple providers** — Never depend on a single free provider. Rotate for resilience.
