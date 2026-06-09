# ZeroAI — Zero-Cost AI From Your Terminal

> **Never pay for AI again.** Stack 10+ free providers. Smart routing. Auto-fallback. ~100M tokens/day for $0.

ZeroAI is a universal CLI + MCP server that gives you free access to the latest AI models — no credit card, no browser automation, no wasted tokens. It intelligently routes your requests to the best free provider, automatically falls back on failure, and stacks rate limits across providers for virtually unlimited capacity.

## Why ZeroAI?

| Problem | ZeroAI Solution |
|---------|----------------|
| AI APIs cost $30-600/mo | **$0 forever** — stacks 10 free providers |
| Rate limits block you | **~100M tokens/day** by rotating providers |
| One provider goes down | **Auto-fallback chain** — never stop working |
| Don't know which model to use | **Smart routing** — picks best model per task |
| Browser AI wastes tokens | **Direct API** — no headless browser needed |
| Privacy concerns with cloud | **Ollama local** — unlimited, private fallback |

## The Free AI Stack (All $0, No Credit Card)

| Provider | Free Models | Rate Limit | Signup |
|----------|-------------|------------|--------|
| **Google AI Studio** | Gemini 2.5 Flash, 2.5 Pro, Flash-Lite | 15 RPM / 1,500 RPD | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Groq** | Llama 3.3 70B, Qwen3 32B, Kimi K2 | 30 RPM / 14,400 RPD | [console.groq.com](https://console.groq.com) |
| **Mistral** | Mistral Large, Codestral, Small | ~1B tokens/month | [console.mistral.ai](https://console.mistral.ai) |
| **Cerebras** | Llama 3.3 70B, Qwen 2.5 32B | 1.5M tokens/day | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| **OpenRouter** | 27+ free models (DeepSeek, Llama, Qwen) | 20 RPM / 50 RPD | [openrouter.ai](https://openrouter.ai) |
| **DeepSeek** | DeepSeek V3, R1 | 5M free signup tokens | [platform.deepseek.com](https://platform.deepseek.com) |
| **Cohere** | Command R+ (128K ctx) | 1,000 calls/month | [dashboard.cohere.com](https://dashboard.cohere.com) |
| **HuggingFace** | 100+ community models | ~few hundred/hr | [huggingface.co](https://huggingface.co) |
| **Cloudflare** | Llama, Mistral, Qwen on edge | 10K neurons/day | [dash.cloudflare.com](https://dash.cloudflare.com) |
| **Ollama** | Any model, unlimited | Unlimited (your hardware) | [ollama.com](https://ollama.com) |

**Combined free capacity: ~100M tokens/day**

## Quick Start

```bash
# 1. Install
npm install -g zeroai

# 2. Setup (guides you through getting free API keys)
zeroai init

# 3. Chat with any free model
zeroai chat "Explain quantum computing"

# 4. Use a specific provider
zeroai chat --provider groq --model llama-3.3-70b "Write a Python web scraper"

# 5. Run as MCP server (for Claude Code, Cursor, etc.)
zeroai serve

# 6. Compare responses across free providers
zeroai compare "What is the meaning of life?"

# 7. Health check
zeroai doctor
```

## Smart Routing

ZeroAI automatically routes to the best free provider based on your task:

| Task | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|------|---------|------------|------------|------------|
| **Coding** | Groq (Llama 70B) | Mistral (Codestral) | Gemini (2.5 Pro) | Ollama |
| **Reasoning** | Gemini (2.5 Pro) | DeepSeek (R1) | OpenRouter (Qwen3 235B) | Ollama |
| **Fast chat** | Groq (500+ tok/s) | Cerebras | Groq (Qwen3) | Ollama |
| **Long context** | Gemini (1M ctx) | OpenRouter (Llama 4 Scout) | Mistral (256K) | Ollama |
| **Vision** | Gemini (2.5 Flash) | Ollama (Llama Vision) | — | — |
| **Image gen** | Gemini (2.5 Flash Image) | — | — | — |
| **Tool calling** | Groq (Llama 70B) | Gemini (2.5 Flash) | Cohere (R+) | Ollama |
| **Privacy** | Ollama (local) | — | — | — |

## MCP Server (Claude Code / Cursor / VS Code)

Add to your MCP config:

```json
{
  "mcpServers": {
    "zeroai": {
      "command": "npx",
      "args": ["zeroai", "serve"],
      "env": {
        "GOOGLE_AI_API_KEY": "...",
        "GROQ_API_KEY": "...",
        "MISTRAL_API_KEY": "..."
      }
    }
  }
}
```

### 8 MCP Tools

| Tool | Description |
|------|-------------|
| `chat` | Smart chat with auto-routing to best free provider |
| `code_review` | Code review with coding-optimized model |
| `reason` | Deep reasoning for complex problems (DeepSeek R1, Gemini Pro) |
| `quick` | Fast response (Groq/Cerebras — 500+ tok/sec) |
| `compare` | Compare responses across multiple free providers |
| `list_models` | Show all available free models and capabilities |
| `consensus` | Multi-model consensus answer (query 3+ models, synthesize) |
| `generate_image` | Image generation via Gemini free tier |

## Environment Variables

```bash
# All optional — only set the ones you want
GOOGLE_AI_API_KEY=        # Gemini (free @ aistudio.google.com)
GROQ_API_KEY=             # Groq (free @ console.groq.com)
MISTRAL_API_KEY=          # Mistral (free @ console.mistral.ai)
CEREBRAS_API_KEY=         # Cerebras (free @ cloud.cerebras.ai)
OPENROUTER_API_KEY=       # OpenRouter (free @ openrouter.ai)
DEEPSEEK_API_KEY=         # DeepSeek (free @ platform.deepseek.com)
COHERE_API_KEY=           # Cohere (free @ dashboard.cohere.com)
HUGGINGFACE_TOKEN=        # HuggingFace (free @ huggingface.co)
CLOUDFLARE_ACCOUNT_ID=    # Cloudflare (free @ dash.cloudflare.com)
```

## Use with OpenAI SDK (Drop-In Replacement)

Every provider except Gemini uses the OpenAI-compatible API format:

```python
from openai import OpenAI
import os

# Groq — fastest, free
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello!"}],
)

# Cerebras — ultra-fast, free
client = OpenAI(base_url="https://api.cerebras.ai/v1", api_key=os.environ["CEREBRAS_API_KEY"])

# Ollama — local, unlimited
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
```

## Rate Limit Multiplication

Stack multiple free providers and rotate between them:

| Combined Stack | Effective Rate Limit | Total Daily Tokens |
|---|---|---|
| Google + Groq + Mistral | 55 RPM / 500K+ RPD | ~50M tokens/day |
| + Cerebras + OpenRouter | 105 RPM / 510K+ RPD | ~75M tokens/day |
| + DeepSeek + Cohere | 225 RPM / 540K+ RPD | ~100M tokens/day |
| + Ollama (local) | **Unlimited** fallback | **∞** |

## Cost Comparison

| Usage Level | ZeroAI (Free Stack) | OpenAI API | Anthropic API |
|---|---|---|---|
| 1K messages/day | **$0** | ~$30-60/mo | ~$40-80/mo |
| 10K messages/day | **$0** | ~$300-600/mo | ~$400-800/mo |
| 100K messages/day | **$0** (rotate) | ~$3,000-6,000/mo | ~$4,000-8,000/mo |
| Unlimited | **$0** (Ollama) | ~$10,000+/mo | ~$15,000+/mo |

**Annual savings: $360 — $180,000+**

## Architecture

```
Your Terminal / Claude Code / Cursor
            │
            ▼
    ┌──────────────┐
    │   ZeroAI     │
    │  Smart Router│
    └──────┬───────┘
           │
    ┌──────┼──────┬───────┬───────┬───────┐
    ▼      ▼      ▼       ▼       ▼       ▼
Google  Groq  Mistral  Cerebras  ...  Ollama
(1.5K   (14K   (1B tok  (1.5M    ...  (Unlimited
 RPD)    RPD)   /mo)     /day)         local)
```

## Important Notes

1. **Free tier data may be used for training** — Don't send sensitive data to Google/Groq/OpenRouter free tiers.
2. **Use Ollama for sensitive work** — Completely private, no data leaves your machine.
3. **DeepSeek is based in China** — Consider data privacy implications.
4. **Google free tier not available in EU/EEA** — Use VPN or other providers.
5. **Stack multiple providers** — Never depend on a single free provider. Rotate for resilience.

## License

MIT
