/**
 * Universal AI Client — Calls any free provider using OpenAI-compatible API format
 * Every provider listed supports the /chat/completions endpoint.
 */

import { FreeProvider, FreeModel, getBestProvider, getFallbackChain, TaskType } from './config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: { input: number; output: number };
  latencyMs: number;
}

export interface ChatOptions {
  model?: string;
  provider?: string;
  task?: TaskType;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  maxRetries?: number;
}

/**
 * Send a chat message to the best available free provider.
 * Automatically falls back through the chain if a provider fails.
 */
export async function chat(prompt: string, options: ChatOptions = {}): Promise<ChatResponse> {
  const {
    task = 'general',
    maxRetries = 3,
    systemPrompt,
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  // Get the fallback chain for this task
  const chain = getFallbackChain(task);

  // If user specified a provider/model, try it first
  if (options.provider || options.model) {
    const preferred = chain.find(c =>
      (!options.provider || c.provider.id === options.provider) &&
      (!options.model || c.model.id === options.model)
    );
    if (preferred) {
      chain.unshift(preferred);
    }
  }

  let lastError: Error | null = null;

  for (const { provider, model } of chain) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await callProvider(provider, model, messages, {
          maxTokens,
          temperature,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const isRateLimit = error?.status === 429 || error?.message?.includes('rate_limit');
        const isServerError = error?.status >= 500;

        if (isRateLimit || isServerError) {
          // Wait and retry, or fall through to next provider
          if (attempt < maxRetries && isServerError) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          break; // Fall through to next provider
        }

        // Client error (not rate limit) — don't retry
        throw error;
      }
    }

    // Move to next provider in chain
    console.error(`⚠️  ${provider.name} failed, trying next provider...`);
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

/**
 * Call a specific provider's API
 */
async function callProvider(
  provider: FreeProvider,
  model: FreeModel,
  messages: ChatMessage[],
  options: { maxTokens: number; temperature: number },
): Promise<ChatResponse> {
  const startTime = Date.now();

  // ─── Google Gemini (different API format) ────────────────────────
  if (provider.id === 'google') {
    return callGemini(provider, model, messages, options, startTime);
  }

  // ─── Cohere (different API format) ──────────────────────────────
  if (provider.id === 'cohere') {
    return callCohere(provider, model, messages, options, startTime);
  }

  // ─── Ollama (OpenAI-compatible but local) ───────────────────────
  if (provider.id === 'ollama') {
    return callOllama(provider, model, messages, options, startTime);
  }

  // ─── All other providers (OpenAI-compatible) ────────────────────
  const apiKey = provider.apiKeyEnvVar ? process.env[provider.apiKeyEnvVar] : '';
  const url = `${provider.baseURL}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // OpenRouter specific headers
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://zeroai.dev';
    headers['X-Title'] = 'ZeroAI';
  }

  const body = {
    model: model.id,
    messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`${provider.name} API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  return {
    text: data.choices?.[0]?.message?.content || '',
    model: model.id,
    provider: provider.id,
    tokensUsed: data.usage ? {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    } : undefined,
    latencyMs,
  };
}

/**
 * Google Gemini API (non-OpenAI format)
 */
async function callGemini(
  provider: FreeProvider,
  model: FreeModel,
  messages: ChatMessage[],
  options: { maxTokens: number; temperature: number },
  startTime: number,
): Promise<ChatResponse> {
  const apiKey = process.env[provider.apiKeyEnvVar]!;
  const url = `${provider.baseURL}/models/${model.id}:generateContent`;

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system');

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const error: any = new Error(`Gemini API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model: model.id,
    provider: provider.id,
    tokensUsed: data.usageMetadata ? {
      input: data.usageMetadata.promptTokenCount,
      output: data.usageMetadata.candidatesTokenCount,
    } : undefined,
    latencyMs,
  };
}

/**
 * Cohere API (non-OpenAI format)
 */
async function callCohere(
  provider: FreeProvider,
  model: FreeModel,
  messages: ChatMessage[],
  options: { maxTokens: number; temperature: number },
  startTime: number,
): Promise<ChatResponse> {
  const apiKey = process.env[provider.apiKeyEnvVar]!;
  const url = `${provider.baseURL}/chat`;

  const body = {
    model: model.id,
    message: messages[messages.length - 1]?.content || '',
    chat_history: messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : m.role === 'system' ? 'SYSTEM' : 'USER',
      message: m.content,
    })),
    max_tokens: options.maxTokens,
    temperature: options.temperature,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const error: any = new Error(`Cohere API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  return {
    text: data.text || '',
    model: model.id,
    provider: provider.id,
    tokensUsed: data.meta?.tokens ? {
      input: data.meta.tokens.input_tokens,
      output: data.meta.tokens.output_tokens,
    } : undefined,
    latencyMs,
  };
}

/**
 * Ollama local API (OpenAI-compatible)
 */
async function callOllama(
  provider: FreeProvider,
  model: FreeModel,
  messages: ChatMessage[],
  options: { maxTokens: number; temperature: number },
  startTime: number,
): Promise<ChatResponse> {
  const url = `${provider.baseURL}/v1/chat/completions`;

  const body = {
    model: model.id,
    messages,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    stream: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const error: any = new Error(`Ollama error (is it running?): ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as any;
  const latencyMs = Date.now() - startTime;

  return {
    text: data.choices?.[0]?.message?.content || '',
    model: model.id,
    provider: provider.id,
    tokensUsed: data.usage ? {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    } : undefined,
    latencyMs,
  };
}

/**
 * Compare responses across multiple free providers
 */
export async function compare(
  prompt: string,
  providers?: string[],
): Promise<{ provider: string; model: string; response: string; latencyMs: number }[]> {
  const results: { provider: string; model: string; response: string; latencyMs: number }[] = [];

  const chain = getFallbackChain('general');
  const targets = providers
    ? chain.filter(c => providers.includes(c.provider.id))
    : chain.slice(0, 4); // Compare top 4 by default

  await Promise.allSettled(
    targets.map(async ({ provider, model }) => {
      try {
        const result = await chat(prompt, {
          provider: provider.id,
          model: model.id,
          maxRetries: 1,
        });
        results.push({
          provider: provider.name,
          model: model.name,
          response: result.text,
          latencyMs: result.latencyMs,
        });
      } catch (error: any) {
        results.push({
          provider: provider.name,
          model: model.name,
          response: `Error: ${error.message}`,
          latencyMs: 0,
        });
      }
    })
  );

  return results.sort((a, b) => a.latencyMs - b.latencyMs);
}
