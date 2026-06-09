# ZeroAI — Zero-Cost AI From Your Terminal

> **Never pay for AI again.** Stack 10+ free providers. Smart routing. Auto-fallback. Transparent proxy for Claude Code/Codex/Cursor. ~100M tokens/day for $0.

ZeroAI is a universal CLI + MCP server + **transparent proxy** that gives you free access to the latest AI models — no credit card, no browser automation, no wasted tokens. It intelligently routes your requests to the best free provider, automatically falls back on failure, and stacks rate limits across providers for virtually unlimited capacity.

## The Magic Trick: Transparent Proxy

**ZeroAI runs a local proxy that makes AI tools think they're talking to their official APIs, while secretly routing everything through free providers. Zero official tokens consumed.**

```
Claude Code ──→ thinks it's api.anthropic.com ──→ localhost:2016 ──→ Gemini 2.5 Pro (free)
Codex ────────→ thinks it's api.openai.com ──────→ localhost:2016 ──→ Groq Llama 70B (free)
Cursor ───────→ thinks it's api.openai.com ──────→ localhost:2016 ──→ DeepSeek V3 (free)
```

Your AI tools see their own API format, their own model names, everything looks normal — but **not a single token hits the official APIs**. All traffic goes through ZeroAI's free provider stack.

### Model Mapping (Automatic)

When your tool asks for a model, ZeroAI silently swaps it to the best free equivalent:

| Requested Model | ZeroAI Routes To | Why |
|----------------|-----------------|-----|
| `claude-sonnet-4` | Gemini 2.5 Pro | Best free reasoning/code |
| `claude-3.5-sonnet` | Gemini 2.5 Pro | Best free coding |
| `claude-3-haiku` | Groq Llama 70B | Ultra-fast, free |
| `gpt-4o` | Gemini 2.5 Pro | Best free alternative |
| `gpt-4o-mini` | Groq Llama 70B | Fast, free |
| `o3` / `o3-mini` | DeepSeek R1 | Best free reasoner |
| `gpt-3.5-turbo` | Groq Llama 8B | Ultra-fast, free |

## Quick Start

### Step 1: Start the Proxy

```bash
# Install
npm install -g zeroai

# Get free API keys (one-time)
zeroai init

# Start the transparent proxy
zeroai proxy
```

### Step 2: Inject Environment Variables

```bash
# Print the export commands
zeroai inject

# Or set them directly:
export ANTHROPIC_BASE_URL=http://localhost:2016/anthropic
export ANTHROPIC_API_KEY=sk-zeroai-local
export OPENAI_BASE_URL=http://localhost:2016/v1
export OPENAI_API_KEY=sk-zeroai-local
```

### Step 3: Use Your Tools Normally

```bash
# Claude Code — will use free Gemini/Groq instead of Anthropic
claude

# Codex — will use free Gemini/Groq instead of OpenAI
codex

# Cursor — set base_url in settings to http://localhost:2016/v1

# Any OpenAI-compatible tool — just point base_url to localhost:2016
```

**That's it. Your tools work exactly as before, but all API calls are free.**

## Why ZeroAI?

| Problem | ZeroAI Solution |
|---------|----------------|
| Claude Code costs $20-100/mo | **$0** — proxy routes to free providers |
| OpenAI API costs $30-600/mo | **$0** — transparent proxy intercepts all calls |
| Rate limits block you | **~100M tokens/day** by rotating 10 providers |
| One provider goes down | **Auto-fallback chain** — never stop working |
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
| **Ollama** | Any model, unlimited | Unlimited (your hardware) | [ollama.com](https://ollama.com) |

**Combined free capacity: ~100M tokens/day**

## CLI Commands

```bash
zeroai init          # Setup wizard — get free API keys
zeroai proxy         # Start transparent proxy for Claude Code/Codex/Cursor
zeroai inject        # Print env vars to redirect tools to the proxy
zeroai chat "Hello"  # Chat with best free model directly
zeroai serve         # Run as MCP server
zeroai models        # List available free models
zeroai compare "Hi"  # Compare providers side-by-side
zeroai doctor        # Health check your configuration
```

## Transparent Proxy Setup

### For Claude Code (Anthropic API)

```bash
# 1. Start proxy
zeroai proxy

# 2. Set environment variables
export ANTHROPIC_BASE_URL=http://localhost:2016/anthropic
export ANTHROPIC_API_KEY=sk-zeroai-local

# 3. Use Claude Code normally — all calls go through free providers
claude
```

### For Codex / OpenAI Tools

```bash
# 1. Start proxy
zeroai proxy

# 2. Set environment variables
export OPENAI_BASE_URL=http://localhost:2016/v1
export OPENAI_API_KEY=sk-zeroai-local

# 3. Use Codex normally
codex
```

### For Cursor / Continue / Any Tool

In the tool's settings, configure:
```
base_url = http://localhost:2016/v1
api_key  = sk-zeroai-local
```

### Persistent Setup (Add to ~/.bashrc or ~/.zshrc)

```bash
# ZeroAI Transparent Proxy — zero official tokens
export ANTHROPIC_BASE_URL=http://localhost:2016/anthropic
export ANTHROPIC_API_KEY=sk-zeroai-local
export OPENAI_BASE_URL=http://localhost:2016/v1
export OPENAI_API_KEY=sk-zeroai-local
```

### How It Works

1. Your AI tool (Claude Code, Codex, etc.) sends a request to `localhost:2016`
2. ZeroAI receives the request in Anthropic or OpenAI format
3. It maps the requested model to the best free equivalent (e.g., `claude-sonnet-4` → `gemini-2.5-pro`)
4. It converts the message format if needed (Anthropic ↔ OpenAI ↔ Gemini)
5. It routes the request through the free provider fallback chain
6. It converts the response back to the original format
7. Your tool receives a perfectly formatted response — it never knows the difference

**Supports streaming (SSE) for both Anthropic and OpenAI formats.**

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
# Free provider API keys (all optional)
GOOGLE_AI_API_KEY=        # Gemini (free @ aistudio.google.com)
GROQ_API_KEY=             # Groq (free @ console.groq.com)
MISTRAL_API_KEY=          # Mistral (free @ console.mistral.ai)
CEREBRAS_API_KEY=         # Cerebras (free @ cloud.cerebras.ai)
OPENROUTER_API_KEY=       # OpenRouter (free @ openrouter.ai)
DEEPSEEK_API_KEY=         # DeepSeek (free @ platform.deepseek.com)
COHERE_API_KEY=           # Cohere (free @ dashboard.cohere.com)
```

## Rate Limit Multiplication

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
Claude Code / Codex / Cursor / Any Tool
            │
    (thinks it's official API)
            │
            ▼
    ┌──────────────────┐
    │  ZeroAI Proxy    │
    │  localhost:2016  │
    │                  │
    │  • Anthropic API │  ← Claude Code talks here
    │  • OpenAI API    │  ← Codex/Cursor talk here
    │  • Model mapping │  ← claude-sonnet-4 → gemini-2.5-pro
    │  • Format conv.  │  ← Anthropic ↔ OpenAI ↔ Gemini
    │  • Auto-fallback │  ← provider fails? try next
    │  • Streaming SSE │  ← real-time token streaming
    └────────┬─────────┘
             │
    ┌────────┼──────┬───────┬───────┬───────┐
    ▼        ▼      ▼       ▼       ▼       ▼
 Google   Groq  Mistral  Cerebras  ...  Ollama
 (1.5K    (14K   (1B tok  (1.5M    ...  (∞ local
  RPD)     RPD)   /mo)     /day)         free)
```

## Important Notes

1. **Free tier data may be used for training** — Don't send sensitive data to Google/Groq/OpenRouter free tiers.
2. **Use Ollama for sensitive work** — Completely private, no data leaves your machine.
3. **DeepSeek is based in China** — Consider data privacy implications.
4. **Google free tier not available in EU/EEA** — Use VPN or other providers.
5. **Stack multiple providers** — Never depend on a single free provider. Rotate for resilience.
6. **Proxy is local only** — The proxy only listens on localhost. Your API keys never leave your machine.

## License

MIT
