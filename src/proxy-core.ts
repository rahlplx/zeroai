/**
 * ZeroAI Transparent Proxy — Testable Core
 *
 * Exports all internal functions for unit testing.
 * The proxy server itself is in proxy.ts, which imports from here.
 */

import http from 'http';
import { PROVIDERS, getFallbackChain, TaskType } from './config.js';

// ─── Model Mapping ────────────────────────────────────────────────────

export const MODEL_MAP: Record<string, { provider: string; model: string; task: TaskType }> = {
  // Anthropic models → free equivalents
  'claude-sonnet-4-20250514':       { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'claude-sonnet-4':                { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'claude-3-5-sonnet-20241022':     { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'claude-3-5-sonnet-latest':       { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'claude-3-5-haiku-20241022':      { provider: 'groq',    model: 'llama-3.3-70b-versatile', task: 'fast' },
  'claude-3-5-haiku-latest':        { provider: 'groq',    model: 'llama-3.3-70b-versatile', task: 'fast' },
  'claude-3-opus-20240229':         { provider: 'google',   model: 'gemini-2.5-pro',          task: 'reasoning' },
  'claude-3-opus-latest':           { provider: 'google',   model: 'gemini-2.5-pro',          task: 'reasoning' },
  'claude-3-haiku-20240307':        { provider: 'groq',    model: 'llama-3.1-8b-instant',    task: 'fast' },

  // OpenAI models → free equivalents
  'gpt-4o':                         { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'gpt-4o-2024-08-06':             { provider: 'google',   model: 'gemini-2.5-pro',          task: 'coding' },
  'gpt-4o-mini':                    { provider: 'groq',    model: 'llama-3.3-70b-versatile', task: 'fast' },
  'gpt-4o-mini-2024-07-18':        { provider: 'groq',    model: 'llama-3.3-70b-versatile', task: 'fast' },
  'gpt-4-turbo':                    { provider: 'google',   model: 'gemini-2.5-flash',         task: 'coding' },
  'gpt-4':                          { provider: 'google',   model: 'gemini-2.5-pro',          task: 'reasoning' },
  'gpt-3.5-turbo':                  { provider: 'groq',    model: 'llama-3.1-8b-instant',    task: 'fast' },
  'o3':                             { provider: 'deepseek', model: 'deepseek-reasoner',        task: 'reasoning' },
  'o3-mini':                        { provider: 'deepseek', model: 'deepseek-reasoner',        task: 'reasoning' },
  'o1':                             { provider: 'deepseek', model: 'deepseek-reasoner',        task: 'reasoning' },
  'o1-mini':                        { provider: 'deepseek', model: 'deepseek-reasoner',        task: 'reasoning' },
  'o1-preview':                     { provider: 'deepseek', model: 'deepseek-reasoner',        task: 'reasoning' },

  // Google models (passthrough)
  'gemini-2.5-pro':                 { provider: 'google',   model: 'gemini-2.5-pro',          task: 'general' },
  'gemini-2.5-flash':               { provider: 'google',   model: 'gemini-2.5-flash',         task: 'fast' },

  // Already-free models (passthrough)
  'llama-3.3-70b-versatile':        { provider: 'groq',    model: 'llama-3.3-70b-versatile', task: 'coding' },
  'deepseek-chat':                  { provider: 'deepseek', model: 'deepseek-chat',           task: 'general' },
  'deepseek-reasoner':              { provider: 'deepseek', model: 'deepseek-reasoner',       task: 'reasoning' },
  'mistral-large-latest':           { provider: 'mistral',  model: 'mistral-large-latest',    task: 'general' },
};

export function resolveModel(requestedModel: string): { provider: string; model: string; task: TaskType } {
  // Exact match
  if (MODEL_MAP[requestedModel]) return MODEL_MAP[requestedModel];

  // Partial match (e.g., "claude-3.5-sonnet" without date suffix)
  for (const [key, value] of Object.entries(MODEL_MAP)) {
    if (requestedModel.startsWith(key) || key.startsWith(requestedModel)) return value;
  }

  // Fuzzy: check more specific patterns first (haiku before claude, etc.)
  const lower = requestedModel.toLowerCase();
  if (lower.includes('haiku')) {
    return { provider: 'groq', model: 'llama-3.3-70b-versatile', task: 'fast' };
  }
  if (lower.includes('claude') || lower.includes('sonnet') || lower.includes('opus')) {
    return { provider: 'google', model: 'gemini-2.5-pro', task: 'coding' };
  }
  if (lower.includes('gpt-4') || lower.includes('gpt4')) {
    return { provider: 'google', model: 'gemini-2.5-pro', task: 'coding' };
  }
  if (lower.includes('gpt-3') || lower.includes('gpt3')) {
    return { provider: 'groq', model: 'llama-3.1-8b-instant', task: 'fast' };
  }
  if (lower.includes('o1') || lower.includes('o3')) {
    return { provider: 'deepseek', model: 'deepseek-reasoner', task: 'reasoning' };
  }

  // Default: best general free model
  return { provider: 'google', model: 'gemini-2.5-flash', task: 'general' };
}

// ─── Format Conversion ────────────────────────────────────────────────

/**
 * Convert Anthropic Messages API format → OpenAI Chat Completions format
 */
export function anthropicToOpenAI(body: any): {
  messages: Array<{ role: string; content: string | any[] }>;
  model: string;
  max_tokens: number;
  temperature?: number;
  tools?: any[];
  stream?: boolean;
} {
  const messages: Array<{ role: string; content: string | any[] }> = [];

  // System prompt
  if (body.system) {
    const sysContent = typeof body.system === 'string'
      ? body.system
      : Array.isArray(body.system)
        ? body.system.map((b: any) => b.text || '').join('\n')
        : '';
    if (sysContent) messages.push({ role: 'system', content: sysContent });
  }

  // Convert messages
  for (const msg of body.messages || []) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        messages.push({ role: 'user', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts: string[] = [];
        const imageParts: any[] = [];
        for (const block of msg.content) {
          if (block.type === 'text') textParts.push(block.text);
          else if (block.type === 'tool_result') {
            const resultContent = typeof block.content === 'string'
              ? block.content
              : Array.isArray(block.content)
                ? block.content.map((c: any) => c.text || JSON.stringify(c)).join('\n')
                : JSON.stringify(block.content);
            textParts.push(`[Tool Result (${block.tool_use_id})]: ${resultContent}`);
          }
          else if (block.type === 'image') {
            imageParts.push({ type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } });
          }
        }
        if (textParts.length > 0 && imageParts.length > 0) {
          messages.push({ role: 'user', content: [...textParts.map(t => ({ type: 'text', text: t })), ...imageParts] });
        } else if (imageParts.length > 0) {
          messages.push({ role: 'user', content: imageParts });
        } else {
          messages.push({ role: 'user', content: textParts.join('\n') });
        }
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        messages.push({ role: 'assistant', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts: string[] = [];
        const toolCalls: any[] = [];
        for (const block of msg.content) {
          if (block.type === 'text') {
            textParts.push(block.text);
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              type: 'function',
              function: {
                name: block.name,
                arguments: typeof block.input === 'string' ? block.input : JSON.stringify(block.input),
              },
            });
          }
        }
        const assistantMsg: any = {
          role: 'assistant',
          content: textParts.join('\n') || null,
        };
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls;
        }
        messages.push(assistantMsg);
      }
    }
  }

  // Convert tools from Anthropic format to OpenAI format
  let tools: any[] | undefined;
  if (body.tools && body.tools.length > 0) {
    tools = body.tools.map((t: any) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.input_schema || { type: 'object', properties: {} },
      },
    }));
  }

  return {
    messages,
    model: body.model || 'claude-sonnet-4-20250514',
    max_tokens: body.max_tokens || 8192,
    temperature: body.temperature,
    tools,
    stream: body.stream,
  };
}

/**
 * Convert OpenAI Chat Completions response → Anthropic Messages API response
 */
export function openAIToAnthropicResponse(openaiResp: any, originalModel: string): any {
  const choice = openaiResp.choices?.[0];
  if (!choice) {
    return {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'No response generated.' }],
      model: originalModel,
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }

  const content: any[] = [];

  // Text content
  if (choice.message?.content) {
    content.push({ type: 'text', text: choice.message.content });
  }

  // Tool calls → Anthropic tool_use blocks
  if (choice.message?.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: tc.id || `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}'),
      });
    }
  }

  // If no content at all, add empty text
  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }

  const stopReason = choice.finish_reason === 'tool_calls'
    ? 'tool_use'
    : choice.finish_reason === 'length'
      ? 'max_tokens'
      : 'end_turn';

  return {
    id: `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    model: originalModel,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: openaiResp.usage?.prompt_tokens || 0,
      output_tokens: openaiResp.usage?.completion_tokens || 0,
    },
  };
}

// ─── Provider Call (with fallback chain) ──────────────────────────────

export async function callFreeProvider(
  openaiFormat: {
    messages: Array<{ role: string; content: string | any[] }>;
    model: string;
    max_tokens: number;
    temperature?: number;
    tools?: any[];
  },
  requestedModel: string,
): Promise<any> {
  const resolved = resolveModel(requestedModel);
  const chain = getFallbackChain(resolved.task);

  // Put the resolved provider first in the chain
  const orderedChain = [
    ...chain.filter(c => c.provider.id === resolved.provider),
    ...chain.filter(c => c.provider.id !== resolved.provider),
  ];

  let lastError: Error | null = null;

  for (const { provider, model } of orderedChain) {
    // Skip providers without API keys
    if (provider.apiKeyEnvVar && !process.env[provider.apiKeyEnvVar]) continue;

    try {
      const result = await callProviderOpenAI(provider, model, openaiFormat);
      // Inject the original model name so the tool thinks it got what it asked for
      result.model = requestedModel;
      return result;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate_limit');
      const isServerError = error?.status >= 500;

      if (!isRateLimit && !isServerError) {
        continue;
      }
      continue;
    }
  }

  throw new Error(`All free providers failed. Last error: ${lastError?.message}`);
}

async function callProviderOpenAI(
  provider: any,
  model: any,
  openaiFormat: {
    messages: Array<{ role: string; content: string | any[] }>;
    model: string;
    max_tokens: number;
    temperature?: number;
    tools?: any[];
  },
): Promise<any> {
  // ─── Google Gemini (different API) ─────────────────────────────────
  if (provider.id === 'google') {
    return callGeminiProxy(provider, model, openaiFormat);
  }

  // ─── All other providers (OpenAI-compatible) ──────────────────────
  const apiKey = provider.apiKeyEnvVar ? process.env[provider.apiKeyEnvVar] : '';
  const url = `${provider.baseURL}/chat/completions`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://zeroai.dev';
    headers['X-Title'] = 'ZeroAI';
  }

  const body: any = {
    model: model.id,
    messages: openaiFormat.messages,
    max_tokens: openaiFormat.max_tokens,
    temperature: openaiFormat.temperature ?? 0.7,
  };

  // Include tools if the provider supports function calling
  if (openaiFormat.tools && openaiFormat.tools.length > 0) {
    const toolProviders = ['groq', 'mistral', 'cohere', 'openrouter', 'deepseek', 'ollama'];
    if (toolProviders.includes(provider.id)) {
      body.tools = openaiFormat.tools;
    } else {
      // For providers without tool support, inject tool descriptions into the system prompt
      const toolDescs = openaiFormat.tools
        .map((t: any) => `- ${t.function.name}: ${t.function.description}`)
        .join('\n');
      const toolSystemMsg = `\n\nYou have access to these tools. When you need to use one, output a JSON block like: {"tool_use": {"name": "tool_name", "input": {...}}}\n\nAvailable tools:\n${toolDescs}`;
      const sysIdx = body.messages.findIndex((m: any) => m.role === 'system');
      if (sysIdx >= 0) {
        body.messages[sysIdx].content += toolSystemMsg;
      } else {
        body.messages.unshift({ role: 'system', content: toolSystemMsg });
      }
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`${provider.name} API error: ${response.status} ${errorText}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

/**
 * Call Gemini API and return OpenAI-format response
 */
async function callGeminiProxy(
  provider: any,
  model: any,
  openaiFormat: {
    messages: Array<{ role: string; content: string | any[] }>;
    model: string;
    max_tokens: number;
    temperature?: number;
    tools?: any[];
  },
): Promise<any> {
  const apiKey = process.env[provider.apiKeyEnvVar];
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const url = `${provider.baseURL}/models/${model.id}:generateContent?key=${apiKey}`;

  // Convert OpenAI messages → Gemini format
  const contents: any[] = [];
  let systemInstruction: string | null = null;

  for (const msg of openaiFormat.messages) {
    if (msg.role === 'system') {
      systemInstruction = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      continue;
    }

    let text = '';
    if (typeof msg.content === 'string') {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content as any[]) {
        if (typeof part === 'string') text += part;
        else if (part.type === 'text') text += part.text;
        else if (part.text) text += part.text;
      }
    }

    const toolCalls = (msg as any).tool_calls;
    if (toolCalls) {
      for (const tc of toolCalls) {
        text += `\n[Tool Call: ${tc.function.name}(${tc.function.arguments})]`;
      }
    }

    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }],
    });
  }

  // If tools provided, inject as system instruction
  if (openaiFormat.tools && openaiFormat.tools.length > 0) {
    const toolDescs = openaiFormat.tools
      .map((t: any) => `- ${t.function.name}: ${t.function.description}\n  Parameters: ${JSON.stringify(t.function.parameters)}`)
      .join('\n\n');
    const toolSystemMsg = `\n\nYou have access to these tools. When you need to use one, output a JSON block like: {"tool_use": {"name": "tool_name", "input": {...}}}\n\nAvailable tools:\n${toolDescs}`;
    systemInstruction = (systemInstruction || '') + toolSystemMsg;
  }

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: openaiFormat.max_tokens,
      temperature: openaiFormat.temperature ?? 0.7,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`Gemini API error: ${response.status} ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Convert Gemini response → OpenAI format
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model.id,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: text },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0),
    },
  };
}

// ─── Streaming Support ────────────────────────────────────────────────

async function streamFromProvider(
  openaiFormat: any,
  requestedModel: string,
  res: http.ServerResponse,
  format: 'openai' | 'anthropic',
): Promise<void> {
  const resolved = resolveModel(requestedModel);
  const chain = getFallbackChain(resolved.task);
  const orderedChain = [
    ...chain.filter(c => c.provider.id === resolved.provider),
    ...chain.filter(c => c.provider.id !== resolved.provider),
  ];

  for (const { provider, model } of orderedChain) {
    if (provider.apiKeyEnvVar && !process.env[provider.apiKeyEnvVar]) continue;

    try {
      if (provider.id === 'google') {
        const result = await callProviderOpenAI(provider, model, openaiFormat);
        const text = result.choices?.[0]?.message?.content || '';
        if (format === 'anthropic') {
          streamAnthropicResponse(text, requestedModel, res);
        } else {
          streamOpenAIResponse(text, requestedModel, res);
        }
        return;
      }

      // OpenAI-compatible providers with streaming
      const apiKey = provider.apiKeyEnvVar ? process.env[provider.apiKeyEnvVar] : '';
      const url = `${provider.baseURL}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (provider.id === 'openrouter') {
        headers['HTTP-Referer'] = 'https://zeroai.dev';
        headers['X-Title'] = 'ZeroAI';
      }

      const body: any = {
        model: model.id,
        messages: openaiFormat.messages,
        max_tokens: openaiFormat.max_tokens,
        temperature: openaiFormat.temperature ?? 0.7,
        stream: true,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error: any = new Error(`${provider.name} error: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      if (format === 'anthropic') {
        res.write(`event: message_start\ndata: ${JSON.stringify({
          type: 'message_start',
          message: {
            id: `msg_${Date.now()}`,
            type: 'message',
            role: 'assistant',
            content: [],
            model: requestedModel,
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 },
          },
        })}\n\n`);

        res.write(`event: content_block_start\ndata: ${JSON.stringify({
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        })}\n\n`);
      }

      // Pipe the OpenAI stream and convert to target format
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let totalText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              totalText += delta;
              if (format === 'anthropic') {
                res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: delta },
                })}\n\n`);
              } else {
                parsed.model = requestedModel;
                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
              }
            }
          } catch {}
        }
      }

      // Close the stream
      if (format === 'anthropic') {
        res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);
        res.write(`event: message_delta\ndata: ${JSON.stringify({
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: { output_tokens: totalText.length },
        })}\n\n`);
        res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      } else {
        res.write(`data: [DONE]\n\n`);
      }

      res.end();
      return;
    } catch (error: any) {
      continue;
    }
  }

  // All providers failed
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'All free providers failed', type: 'server_error' } }));
}

function streamOpenAIResponse(text: string, model: string, res: http.ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const chunkSize = 8;
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        delta: { content: chunk },
        finish_reason: null,
      }],
    })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
  })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

function streamAnthropicResponse(text: string, model: string, res: http.ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`event: message_start\ndata: ${JSON.stringify({
    type: 'message_start',
    message: {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    },
  })}\n\n`);

  res.write(`event: content_block_start\ndata: ${JSON.stringify({
    type: 'content_block_start',
    index: 0,
    content_block: { type: 'text', text: '' },
  })}\n\n`);

  const chunkSize = 8;
  for (let i = 0; i < text.length; i += chunkSize) {
    res.write(`event: content_block_delta\ndata: ${JSON.stringify({
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: text.slice(i, i + chunkSize) },
    })}\n\n`);
  }

  res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);

  res.write(`event: message_delta\ndata: ${JSON.stringify({
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: text.length },
  })}\n\n`);

  res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
  res.end();
}

// ─── Request Logging ──────────────────────────────────────────────────

let requestCount = 0;
let totalTokensSaved = 0;

function logRequest(method: string, path: string, model: string, resolvedTo: string, tokens?: number): void {
  requestCount++;
  if (tokens) totalTokensSaved += tokens;
  const timestamp = new Date().toISOString().slice(11, 19);
  console.error(`[${timestamp}] #${requestCount} ${method} ${path} | ${model} → ${resolvedTo}${tokens ? ` | ${tokens} tokens saved` : ''} | Total saved: ${totalTokensSaved}`);
}

// ─── HTTP Server ──────────────────────────────────────────────────────

export function startProxy(port: number = 2016): http.Server {
  const server = http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': 86400,
      });
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://localhost:${port}`);

    // ─── Health / Status ───────────────────────────────────────────
    if (url.pathname === '/' || url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'zeroai-proxy',
        version: '1.0.0',
        requests_proxied: requestCount,
        tokens_saved: totalTokensSaved,
        providers_configured: PROVIDERS.filter(p => !p.apiKeyEnvVar || !!process.env[p.apiKeyEnvVar]).length,
        endpoints: {
          anthropic: `http://localhost:${port}/anthropic/v1/messages`,
          openai: `http://localhost:${port}/v1/chat/completions`,
          models: `http://localhost:${port}/v1/models`,
        },
      }));
      return;
    }

    // ─── List Models (OpenAI format) ───────────────────────────────
    if (url.pathname === '/v1/models' && req.method === 'GET') {
      const models = Object.entries(MODEL_MAP).map(([id, mapping]) => ({
        id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: id.includes('claude') ? 'anthropic' : id.includes('gpt') || id.includes('o1') || id.includes('o3') ? 'openai' : 'zeroai',
        zeroai_routes_to: `${mapping.provider}/${mapping.model}`,
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ object: 'list', data: models }));
      return;
    }

    // ─── Anthropic Messages API ───────────────────────────────────
    if ((url.pathname === '/anthropic/v1/messages' || url.pathname === '/v1/messages') && req.method === 'POST') {
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body);
        const requestedModel = parsed.model || 'claude-sonnet-4-20250514';
        const resolved = resolveModel(requestedModel);
        const openaiFormat = anthropicToOpenAI(parsed);

        logRequest('POST', url.pathname, requestedModel, `${resolved.provider}/${resolved.model}`);

        if (parsed.stream) {
          await streamFromProvider(openaiFormat, requestedModel, res, 'anthropic');
        } else {
          const openaiResp = await callFreeProvider(openaiFormat, requestedModel);
          const anthropicResp = openAIToAnthropicResponse(openaiResp, requestedModel);

          const tokens = anthropicResp.usage?.input_tokens + anthropicResp.usage?.output_tokens;
          logRequest('POST', url.pathname, requestedModel, `${resolved.provider}/${resolved.model}`, tokens);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(anthropicResp));
        }
      } catch (error: any) {
        console.error(`Anthropic proxy error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          type: 'error',
          error: { type: 'api_error', message: error.message },
        }));
      }
      return;
    }

    // ─── OpenAI Chat Completions API ──────────────────────────────
    if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body);
        const requestedModel = parsed.model || 'gpt-4o';
        const resolved = resolveModel(requestedModel);

        logRequest('POST', url.pathname, requestedModel, `${resolved.provider}/${resolved.model}`);

        const openaiFormat = {
          messages: parsed.messages || [],
          model: requestedModel,
          max_tokens: parsed.max_tokens || 4096,
          temperature: parsed.temperature,
          tools: parsed.tools,
        };

        if (parsed.stream) {
          await streamFromProvider(openaiFormat, requestedModel, res, 'openai');
        } else {
          const openaiResp = await callFreeProvider(openaiFormat, requestedModel);

          const tokens = openaiResp.usage?.total_tokens || 0;
          logRequest('POST', url.pathname, requestedModel, `${resolved.provider}/${resolved.model}`, tokens);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(openaiResp));
        }
      } catch (error: any) {
        console.error(`OpenAI proxy error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: { message: error.message, type: 'server_error', code: null },
        }));
      }
      return;
    }

    // ─── 404 ─────────────────────────────────────────────────────
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /v1/chat/completions or /anthropic/v1/messages' }));
  });

  server.listen(port, () => {
    console.error('');
    console.error('  ZeroAI Transparent Proxy v1.0.0');
    console.error('  Zero official tokens. All traffic is free.');
    console.error('');
    console.error(`  Anthropic API:  http://localhost:${port}/anthropic/v1/messages`);
    console.error(`  OpenAI API:     http://localhost:${port}/v1/chat/completions`);
    console.error(`  Models list:    http://localhost:${port}/v1/models`);
    console.error(`  Health:         http://localhost:${port}/health`);
    console.error('');
    console.error('  Setup for Claude Code:');
    console.error(`    export ANTHROPIC_BASE_URL=http://localhost:${port}/anthropic`);
    console.error('    export ANTHROPIC_API_KEY=sk-zeroai-local');
    console.error('');
    console.error('  Setup for Codex / OpenAI tools:');
    console.error(`    export OPENAI_BASE_URL=http://localhost:${port}/v1`);
    console.error('    export OPENAI_API_KEY=sk-zeroai-local');
    console.error('');
  });

  return server;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
