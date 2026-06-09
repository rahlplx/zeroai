/**
 * Free AI Provider Configuration
 * All providers listed here have genuinely free tiers with no credit card required.
 */

export interface FreeProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKeyEnvVar: string;
  signupURL: string;
  freeModels: FreeModel[];
  rateLimit: { rpm: number; rpd: number; tpm: number };
  requiresCreditCard: boolean;
  isPermanent: boolean;
  notes: string;
}

export interface FreeModel {
  id: string;
  name: string;
  contextWindow: number;
  capabilities: ('chat' | 'code' | 'reasoning' | 'vision' | 'image-gen' | 'tools')[];
  quality: 'frontier' | 'high' | 'medium';
  speed: 'ultra' | 'fast' | 'medium' | 'slow';
}

export const PROVIDERS: FreeProvider[] = [
  // ─── TIER 1: Best Free APIs (Permanent, No CC) ─────────────────────
  {
    id: 'google',
    name: 'Google AI Studio',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    signupURL: 'https://aistudio.google.com/apikey',
    freeModels: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextWindow: 1_000_000,
        capabilities: ['chat', 'code', 'reasoning', 'vision', 'image-gen', 'tools'],
        quality: 'high',
        speed: 'fast',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        contextWindow: 1_000_000,
        capabilities: ['chat', 'code', 'reasoning', 'vision', 'tools'],
        quality: 'frontier',
        speed: 'medium',
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        contextWindow: 1_000_000,
        capabilities: ['chat', 'code'],
        quality: 'medium',
        speed: 'ultra',
      },
    ],
    rateLimit: { rpm: 15, rpd: 1500, tpm: 250_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: 'Most generous free API. 1M context. Free tier data may be used for training.',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
    signupURL: 'https://console.groq.com',
    freeModels: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning', 'tools'],
        quality: 'high',
        speed: 'ultra',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        contextWindow: 128_000,
        capabilities: ['chat', 'code'],
        quality: 'medium',
        speed: 'ultra',
      },
      {
        id: 'qwen3-32b',
        name: 'Qwen3 32B',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'high',
        speed: 'ultra',
      },
      {
        id: 'kimi-k2',
        name: 'Kimi K2',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'tools'],
        quality: 'high',
        speed: 'fast',
      },
    ],
    rateLimit: { rpm: 30, rpd: 14_400, tpm: 30_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: 'Fastest API available (500+ tok/sec on LPU). Great for agents.',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseURL: 'https://api.mistral.ai/v1',
    apiKeyEnvVar: 'MISTRAL_API_KEY',
    signupURL: 'https://console.mistral.ai',
    freeModels: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning', 'tools'],
        quality: 'high',
        speed: 'fast',
      },
      {
        id: 'codestral-latest',
        name: 'Codestral',
        contextWindow: 256_000,
        capabilities: ['code'],
        quality: 'high',
        speed: 'fast',
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        contextWindow: 128_000,
        capabilities: ['chat', 'code'],
        quality: 'medium',
        speed: 'ultra',
      },
    ],
    rateLimit: { rpm: 10, rpd: 500_000, tpm: 500_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: 'Experiment plan gives ~1B tokens/month free. Best free quota. Requires phone number.',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKeyEnvVar: 'CEREBRAS_API_KEY',
    signupURL: 'https://cloud.cerebras.ai',
    freeModels: [
      {
        id: 'llama-3.3-70b',
        name: 'Llama 3.3 70B (Cerebras)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'high',
        speed: 'ultra',
      },
      {
        id: 'qwen-2.5-32b',
        name: 'Qwen 2.5 32B (Cerebras)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code'],
        quality: 'medium',
        speed: 'ultra',
      },
    ],
    rateLimit: { rpm: 30, rpd: 10_000, tpm: 100_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: 'Ultra-fast inference on wafer-scale chips. 1.5M tokens/day.',
  },

  // ─── TIER 2: Free Model Variety ────────────────────────────────────
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    signupURL: 'https://openrouter.ai',
    freeModels: [
      {
        id: 'deepseek/deepseek-chat:free',
        name: 'DeepSeek V3 (Free)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'high',
        speed: 'medium',
      },
      {
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'DeepSeek R1 (Free)',
        contextWindow: 128_000,
        capabilities: ['chat', 'reasoning'],
        quality: 'high',
        speed: 'slow',
      },
      {
        id: 'qwen/qwen3-235b-a22b:free',
        name: 'Qwen3 235B (Free)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'frontier',
        speed: 'medium',
      },
      {
        id: 'meta-llama/llama-4-scout:free',
        name: 'Llama 4 Scout (Free)',
        contextWindow: 1_000_000,
        capabilities: ['chat', 'code'],
        quality: 'high',
        speed: 'medium',
      },
    ],
    rateLimit: { rpm: 20, rpd: 50, tpm: 100_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: '27+ free models. Adding $10 balance increases daily limit to 1,000 RPD.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    signupURL: 'https://platform.deepseek.com',
    freeModels: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'frontier',
        speed: 'medium',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1',
        contextWindow: 128_000,
        capabilities: ['chat', 'reasoning'],
        quality: 'frontier',
        speed: 'slow',
      },
    ],
    rateLimit: { rpm: 100, rpd: 50_000, tpm: 1_000_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: '5M free signup tokens. After that, extremely cheap ($0.14/M input). No hard rate limits.',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    baseURL: 'https://api.cohere.ai/v1',
    apiKeyEnvVar: 'COHERE_API_KEY',
    signupURL: 'https://dashboard.cohere.com',
    freeModels: [
      {
        id: 'command-r-plus',
        name: 'Command R+',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'tools'],
        quality: 'high',
        speed: 'fast',
      },
    ],
    rateLimit: { rpm: 20, rpd: 33, tpm: 100_000 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: '1,000 API calls/month on trial key. Resets monthly. 128K context even on free.',
  },

  // ─── TIER 3: Edge / Community / Local ──────────────────────────────
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434',
    apiKeyEnvVar: '',
    signupURL: 'https://ollama.com',
    freeModels: [
      {
        id: 'llama3.3:70b',
        name: 'Llama 3.3 70B (Local)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        quality: 'high',
        speed: 'medium',
      },
      {
        id: 'deepseek-r1:70b',
        name: 'DeepSeek R1 70B (Local)',
        contextWindow: 128_000,
        capabilities: ['chat', 'reasoning'],
        quality: 'high',
        speed: 'slow',
      },
      {
        id: 'qwen3:32b',
        name: 'Qwen3 32B (Local)',
        contextWindow: 128_000,
        capabilities: ['chat', 'code', 'reasoning'],
        quality: 'high',
        speed: 'medium',
      },
    ],
    rateLimit: { rpm: 999, rpd: 999_999, tpm: 999_999 },
    requiresCreditCard: false,
    isPermanent: true,
    notes: 'Unlimited. Your hardware = your limit. OpenAI-compatible API at localhost:11434.',
  },
];

// ─── Smart Routing Logic ────────────────────────────────────────────

export type TaskType = 'coding' | 'reasoning' | 'fast' | 'long-context' | 'vision' | 'image-gen' | 'tools' | 'general';

export function getBestProvider(task: TaskType): { provider: FreeProvider; model: FreeModel } {
  const available = PROVIDERS.filter(p => {
    if (p.id === 'ollama') return false;
    return !p.apiKeyEnvVar || !!process.env[p.apiKeyEnvVar];
  });

  if (available.length === 0) {
    const ollama = PROVIDERS.find(p => p.id === 'ollama')!;
    return { provider: ollama, model: ollama.freeModels[0] };
  }

  switch (task) {
    case 'coding':
      return pickModel(available, ['code'], ['ultra', 'fast'], ['frontier', 'high']);
    case 'reasoning':
      return pickModel(available, ['reasoning'], ['fast', 'medium'], ['frontier', 'high']);
    case 'fast':
      return pickModel(available, ['chat'], ['ultra'], ['high', 'medium']);
    case 'long-context':
      return pickModelByContext(available, 500_000);
    case 'vision':
      return pickModel(available, ['vision'], ['fast', 'medium'], ['frontier', 'high']);
    case 'image-gen':
      return pickModel(available, ['image-gen'], ['medium'], ['high']);
    case 'tools':
      return pickModel(available, ['tools'], ['fast', 'medium'], ['frontier', 'high']);
    case 'general':
    default:
      return pickModel(available, ['chat'], ['fast', 'medium'], ['high', 'medium']);
  }
}

function pickModel(
  providers: FreeProvider[],
  requiredCaps: FreeModel['capabilities'],
  preferredSpeeds: FreeModel['speed'][],
  preferredQuality: FreeModel['quality'][],
): { provider: FreeProvider; model: FreeModel } {
  let best: { provider: FreeProvider; model: FreeModel; score: number } | null = null;

  for (const provider of providers) {
    for (const model of provider.freeModels) {
      if (!requiredCaps.every(cap => model.capabilities.includes(cap))) continue;

      let score = 0;
      const speedIdx = preferredSpeeds.indexOf(model.speed);
      score += speedIdx >= 0 ? (3 - speedIdx) * 10 : 1;
      const qualIdx = preferredQuality.indexOf(model.quality);
      score += qualIdx >= 0 ? (3 - qualIdx) * 5 : 1;
      score += Math.min(provider.rateLimit.rpd, 10000) / 1000;

      if (!best || score > best.score) {
        best = { provider, model, score };
      }
    }
  }

  if (!best) {
    const p = providers[0];
    return { provider: p, model: p.freeModels[0] };
  }

  return { provider: best.provider, model: best.model };
}

function pickModelByContext(
  providers: FreeProvider[],
  minContext: number,
): { provider: FreeProvider; model: FreeModel } {
  let best: { provider: FreeProvider; model: FreeModel } | null = null;

  for (const provider of providers) {
    for (const model of provider.freeModels) {
      if (model.contextWindow >= minContext) {
        if (!best || model.contextWindow > best.model.contextWindow) {
          best = { provider, model };
        }
      }
    }
  }

  if (!best) {
    const p = providers[0];
    return { provider: p, model: p.freeModels[0] };
  }

  return best;
}

// ─── Fallback Chain ──────────────────────────────────────────────────

export function getFallbackChain(task: TaskType): { provider: FreeProvider; model: FreeModel }[] {
  const primary = getBestProvider(task);
  const chain: { provider: FreeProvider; model: FreeModel }[] = [primary];

  for (const provider of PROVIDERS) {
    if (provider.id === primary.provider.id) continue;
    if (provider.id === 'ollama') continue;
    if (provider.apiKeyEnvVar && !process.env[provider.apiKeyEnvVar]) continue;

    for (const model of provider.freeModels) {
      const hasRequiredCap = task === 'general' || model.capabilities.some(c =>
        (task === 'coding' && c === 'code') ||
        (task === 'reasoning' && c === 'reasoning') ||
        (task === 'vision' && c === 'vision') ||
        (task === 'tools' && c === 'tools') ||
        c === 'chat'
      );

      if (hasRequiredCap) {
        chain.push({ provider, model });
        break;
      }
    }
  }

  // Always add Ollama as last resort
  const ollama = PROVIDERS.find(p => p.id === 'ollama')!;
  chain.push({ provider: ollama, model: ollama.freeModels[0] });

  return chain;
}
