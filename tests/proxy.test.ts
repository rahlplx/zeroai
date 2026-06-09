import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolveModel, MODEL_MAP, anthropicToOpenAI, openAIToAnthropicResponse, startProxy } from '../src/proxy-core.js';

// ═══════════════════════════════════════════════════════════════════════
// UNIT TESTS: Model Mapping
// ═══════════════════════════════════════════════════════════════════════

describe('resolveModel', () => {
  it('should map claude-sonnet-4 to Gemini 2.5 Pro', () => {
    const result = resolveModel('claude-sonnet-4');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
    expect(result.task).toBe('coding');
  });

  it('should map claude-sonnet-4-20250514 (full version) to Gemini 2.5 Pro', () => {
    const result = resolveModel('claude-sonnet-4-20250514');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should map claude-3-5-sonnet to Gemini 2.5 Pro', () => {
    const result = resolveModel('claude-3-5-sonnet-20241022');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should map claude-3-5-haiku to Groq Llama 70B (fast)', () => {
    const result = resolveModel('claude-3-5-haiku-latest');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile');
    expect(result.task).toBe('fast');
  });

  it('should map claude-3-haiku to Groq Llama 8B (ultra-fast)', () => {
    const result = resolveModel('claude-3-haiku-20240307');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.1-8b-instant');
  });

  it('should map gpt-4o to Gemini 2.5 Pro', () => {
    const result = resolveModel('gpt-4o');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should map gpt-4o-mini to Groq Llama 70B', () => {
    const result = resolveModel('gpt-4o-mini');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });

  it('should map o3 to DeepSeek R1', () => {
    const result = resolveModel('o3');
    expect(result.provider).toBe('deepseek');
    expect(result.model).toBe('deepseek-reasoner');
  });

  it('should map o1-mini to DeepSeek R1', () => {
    const result = resolveModel('o1-mini');
    expect(result.provider).toBe('deepseek');
    expect(result.model).toBe('deepseek-reasoner');
  });

  it('should map gpt-3.5-turbo to Groq Llama 8B', () => {
    const result = resolveModel('gpt-3.5-turbo');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.1-8b-instant');
  });

  it('should pass through already-free models (gemini-2.5-pro)', () => {
    const result = resolveModel('gemini-2.5-pro');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should pass through already-free models (llama-3.3-70b-versatile)', () => {
    const result = resolveModel('llama-3.3-70b-versatile');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });

  // ─── Fuzzy Matching ─────────────────────────────────────────────

  it('should fuzzy-match unknown claude variant to Gemini 2.5 Pro', () => {
    const result = resolveModel('claude-super-5-new-version');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should fuzzy-match unknown opus variant to Gemini 2.5 Pro', () => {
    const result = resolveModel('claude-opus-max');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should fuzzy-match unknown haiku variant to Groq Llama 70B', () => {
    const result = resolveModel('claude-haiku-turbo');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });

  it('should fuzzy-match unknown gpt-4 variant to a Google model', () => {
    const result = resolveModel('gpt-4-turbo-new');
    expect(result.provider).toBe('google');
    // gpt-4-turbo maps to gemini-2.5-flash (fast tier), gpt-4 maps to pro
    expect(['gemini-2.5-pro', 'gemini-2.5-flash']).toContain(result.model);
  });

  it('should fuzzy-match o3 variant to DeepSeek R1', () => {
    const result = resolveModel('o3-pro-max');
    expect(result.provider).toBe('deepseek');
    expect(result.model).toBe('deepseek-reasoner');
  });

  it('should default completely unknown models to Gemini 2.5 Flash', () => {
    const result = resolveModel('some-unknown-model-xyz');
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-flash');
    expect(result.task).toBe('general');
  });

  it('should handle partial matches (claude-3-5-sonnet without date)', () => {
    const result = resolveModel('claude-3-5-sonnet');
    // Should match claude-3-5-sonnet-latest or claude-3-5-sonnet-20241022
    expect(result.provider).toBe('google');
    expect(result.model).toBe('gemini-2.5-pro');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// UNIT TESTS: Anthropic → OpenAI Format Conversion
// ═══════════════════════════════════════════════════════════════════════

describe('anthropicToOpenAI', () => {
  it('should convert basic Anthropic request to OpenAI format', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Hello, world!' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.model).toBe('claude-sonnet-4-20250514');
    expect(result.max_tokens).toBe(4096);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({ role: 'user', content: 'Hello, world!' });
  });

  it('should convert system prompt from Anthropic to OpenAI format', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      system: 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: 'Hi' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]).toEqual({ role: 'system', content: 'You are a helpful assistant.' });
    expect(result.messages[1]).toEqual({ role: 'user', content: 'Hi' });
  });

  it('should convert system prompt from Anthropic array format', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      system: [
        { type: 'text', text: 'You are a coding assistant.' },
        { type: 'text', text: 'Always use TypeScript.' },
      ],
      messages: [
        { role: 'user', content: 'Write code' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.messages[0]).toEqual({
      role: 'system',
      content: 'You are a coding assistant.\nAlways use TypeScript.',
    });
  });

  it('should convert Anthropic content blocks (array) to text', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toBe('What is in this image?');
  });

  it('should convert Anthropic tool_use blocks to OpenAI tool_calls', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Read the file main.ts' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'I will read the file.' },
            {
              type: 'tool_use',
              id: 'toolu_123',
              name: 'read_file',
              input: { path: 'main.ts' },
            },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    // Should have user + assistant with tool_calls
    const assistantMsg = result.messages.find(m => m.role === 'assistant') as any;
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toBe('I will read the file.');
    expect(assistantMsg.tool_calls).toHaveLength(1);
    expect(assistantMsg.tool_calls[0].function.name).toBe('read_file');
    expect(assistantMsg.tool_calls[0].id).toBe('toolu_123');
    expect(JSON.parse(assistantMsg.tool_calls[0].function.arguments)).toEqual({ path: 'main.ts' });
  });

  it('should convert Anthropic tool_result blocks to OpenAI role:tool messages', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Read main.ts' },
        {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'toolu_123', name: 'read_file', input: { path: 'main.ts' } },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'toolu_123', content: 'file contents here' },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    // FIX: tool_result should now produce role: 'tool' messages (not plain text)
    const toolResultMsg = result.messages.find(m =>
      (m as any).role === 'tool'
    );
    expect(toolResultMsg).toBeDefined();
    expect((toolResultMsg as any).role).toBe('tool');
    expect((toolResultMsg as any).tool_call_id).toBe('toolu_123');
    expect((toolResultMsg as any).content).toContain('file contents here');
  });

  it('should convert Anthropic tools definition to OpenAI format', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      tools: [
        {
          name: 'read_file',
          description: 'Read a file from disk',
          input_schema: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path'],
          },
        },
      ],
      messages: [
        { role: 'user', content: 'Read main.ts' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.tools).toHaveLength(1);
    expect(result.tools![0].type).toBe('function');
    expect(result.tools![0].function.name).toBe('read_file');
    expect(result.tools![0].function.description).toBe('Read a file from disk');
    expect(result.tools![0].function.parameters).toEqual({
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    });
  });

  it('should preserve stream and temperature settings', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      temperature: 0.3,
      stream: true,
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.temperature).toBe(0.3);
    expect(result.stream).toBe(true);
  });

  it('should handle empty messages array', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 1024,
      messages: [],
    };

    const result = anthropicToOpenAI(anthropicReq);

    expect(result.messages).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// UNIT TESTS: OpenAI → Anthropic Response Conversion
// ═══════════════════════════════════════════════════════════════════════

describe('openAIToAnthropicResponse', () => {
  it('should convert basic OpenAI response to Anthropic format', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello! How can I help you?' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    expect(result.type).toBe('message');
    expect(result.role).toBe('assistant');
    expect(result.model).toBe('claude-sonnet-4'); // Original model preserved!
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toEqual({ type: 'text', text: 'Hello! How can I help you?' });
    expect(result.stop_reason).toBe('end_turn');
    expect(result.usage.input_tokens).toBe(10);
    expect(result.usage.output_tokens).toBe(8);
  });

  it('should convert tool_calls in OpenAI response to Anthropic tool_use', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'llama-3.3-70b-versatile',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Let me read that file.',
          tool_calls: [{
            id: 'call_abc123',
            type: 'function',
            function: {
              name: 'read_file',
              arguments: '{"path":"main.ts"}',
            },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    expect(result.content).toHaveLength(2);
    expect(result.content[0]).toEqual({ type: 'text', text: 'Let me read that file.' });
    expect(result.content[1].type).toBe('tool_use');
    expect(result.content[1].name).toBe('read_file');
    expect(result.content[1].id).toBe('call_abc123');
    expect(result.content[1].input).toEqual({ path: 'main.ts' });
    expect(result.stop_reason).toBe('tool_use');
  });

  it('should handle finish_reason=length → stop_reason=max_tokens', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Truncated response...' },
        finish_reason: 'length',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 100, total_tokens: 110 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    expect(result.stop_reason).toBe('max_tokens');
  });

  it('should handle empty choices (no response)', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    expect(result.type).toBe('message');
    expect(result.content[0].type).toBe('text');
    expect(result.stop_reason).toBe('end_turn');
  });

  it('should handle null content (tool_calls only)', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'llama-3.3-70b-versatile',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_xyz',
            type: 'function',
            function: { name: 'bash', arguments: '{"command":"ls"}' },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 15, completion_tokens: 10, total_tokens: 25 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    // Only tool_use, no text
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('tool_use');
    expect(result.content[0].name).toBe('bash');
    expect(result.stop_reason).toBe('tool_use');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// UNIT TESTS: Roundtrip Conversion (Anthropic → OpenAI → Anthropic)
// ═══════════════════════════════════════════════════════════════════════

describe('Roundtrip conversion', () => {
  it('should preserve message content through Anthropic→OpenAI→Anthropic roundtrip', () => {
    // Step 1: Anthropic request
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      system: 'You are a coding assistant.',
      messages: [
        { role: 'user', content: 'Write a Python function' },
      ],
    };

    // Step 2: Convert to OpenAI format
    const openaiFormat = anthropicToOpenAI(anthropicReq);

    // Step 3: Simulate an OpenAI response
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'def hello():\n    print("Hello")' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
    };

    // Step 4: Convert back to Anthropic format
    const anthropicResp = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');

    // Verify: model name is preserved (the trick!)
    expect(anthropicResp.model).toBe('claude-sonnet-4');
    // Verify: content is preserved
    expect(anthropicResp.content[0].text).toBe('def hello():\n    print("Hello")');
    // Verify: Anthropic format structure
    expect(anthropicResp.type).toBe('message');
    expect(anthropicResp.role).toBe('assistant');
    expect(anthropicResp.stop_reason).toBe('end_turn');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS: Proxy Server (HTTP)
// ═══════════════════════════════════════════════════════════════════════

describe('Proxy Server Integration', () => {
  let server: any;
  const TEST_PORT = 9876;
  const BASE = `http://localhost:${TEST_PORT}`;

  beforeAll(async () => {
    server = startProxy(TEST_PORT);
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('should respond to health check', async () => {
    const resp = await fetch(`${BASE}/health`);
    expect(resp.status).toBe(200);

    const data = await resp.json() as any;
    expect(data.status).toBe('ok');
    expect(data.service).toBe('zeroai-proxy');
    expect(data.version).toBe('1.1.0');
    expect(data.endpoints).toBeDefined();
    expect(data.endpoints.anthropic).toContain('/anthropic/v1/messages');
    expect(data.endpoints.openai).toContain('/v1/chat/completions');
  });

  it('should respond to root path', async () => {
    const resp = await fetch(`${BASE}/`);
    expect(resp.status).toBe(200);

    const data = await resp.json() as any;
    expect(data.status).toBe('ok');
  });

  it('should list models in OpenAI format', async () => {
    const resp = await fetch(`${BASE}/v1/models`);
    expect(resp.status).toBe(200);

    const data = await resp.json() as any;
    expect(data.object).toBe('list');
    expect(data.data.length).toBeGreaterThan(0);

    // Check Claude models are listed
    const claudeModels = data.data.filter((m: any) => m.id.includes('claude'));
    expect(claudeModels.length).toBeGreaterThan(0);

    // Check GPT models are listed
    const gptModels = data.data.filter((m: any) => m.id.includes('gpt'));
    expect(gptModels.length).toBeGreaterThan(0);

    // Each model should have routing info
    for (const model of data.data) {
      expect(model.id).toBeDefined();
      expect(model.object).toBe('model');
      expect(model.zeroai_routes_to).toBeDefined();
    }
  });

  it('should handle CORS preflight requests', async () => {
    const resp = await fetch(`${BASE}/health`, { method: 'OPTIONS' });
    expect(resp.status).toBe(200);
    expect(resp.headers.get('access-control-allow-origin')).toBeTruthy();
    expect(resp.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('should return 404 for unknown paths', async () => {
    const resp = await fetch(`${BASE}/unknown/path`);
    expect(resp.status).toBe(404);

    const data = await resp.json() as any;
    expect(data.error).toBeDefined();
  });

  it('should accept Anthropic-format POST and return Anthropic-format response', async () => {
    // This test requires at least one free API key to be set
    // If no keys are configured, the proxy will return a 500 error
    // which is expected behavior — the test verifies the format, not the provider
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Say hello in one word' },
      ],
    };

    const resp = await fetch(`${BASE}/anthropic/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anthropicReq),
    });

    // We accept either 200 (if API keys are configured) or 500 (if not)
    expect([200, 500]).toContain(resp.status);

    if (resp.status === 200) {
      const data = await resp.json() as any;
      // Verify Anthropic response format
      expect(data.type).toBe('message');
      expect(data.role).toBe('assistant');
      expect(data.model).toBe('claude-sonnet-4'); // Model name preserved!
      expect(data.content).toBeDefined();
      expect(data.stop_reason).toBeDefined();
      expect(data.usage).toBeDefined();
    }
  });

  it('should accept OpenAI-format POST and return OpenAI-format response', async () => {
    const openaiReq = {
      model: 'gpt-4o',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Say hello in one word' },
      ],
    };

    const resp = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(openaiReq),
    });

    expect([200, 500]).toContain(resp.status);

    if (resp.status === 200) {
      const data = await resp.json() as any;
      // Verify OpenAI response format
      expect(data.object).toBe('chat.completion');
      expect(data.model).toBe('gpt-4o'); // Model name preserved!
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.role).toBe('assistant');
      expect(data.usage).toBeDefined();
    }
  });

  it('should also accept /v1/messages as Anthropic endpoint', async () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Hi' },
      ],
    };

    const resp = await fetch(`${BASE}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anthropicReq),
    });

    // Should work the same as /anthropic/v1/messages
    expect([200, 500]).toContain(resp.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MODEL MAP COVERAGE TEST
// ═══════════════════════════════════════════════════════════════════════

describe('MODEL_MAP coverage', () => {
  it('should have at least 25 model mappings', () => {
    const keys = Object.keys(MODEL_MAP);
    expect(keys.length).toBeGreaterThanOrEqual(25);
  });

  it('should map all entries to valid providers', () => {
    const validProviders = ['google', 'groq', 'mistral', 'cerebras', 'openrouter', 'deepseek', 'cohere', 'ollama'];

    for (const [model, mapping] of Object.entries(MODEL_MAP)) {
      expect(validProviders).toContain(mapping.provider);
      expect(mapping.model).toBeTruthy();
      expect(mapping.task).toBeTruthy();
    }
  });

  it('should have all major Claude models covered', () => {
    const claudeModels = Object.keys(MODEL_MAP).filter(k => k.includes('claude'));
    expect(claudeModels.length).toBeGreaterThanOrEqual(8);

    // Essential ones
    expect(MODEL_MAP['claude-sonnet-4']).toBeDefined();
    expect(MODEL_MAP['claude-3-5-sonnet-latest']).toBeDefined();
    expect(MODEL_MAP['claude-3-5-haiku-latest']).toBeDefined();
    expect(MODEL_MAP['claude-3-opus-latest']).toBeDefined();
  });

  it('should have all major GPT models covered', () => {
    expect(MODEL_MAP['gpt-4o']).toBeDefined();
    expect(MODEL_MAP['gpt-4o-mini']).toBeDefined();
    expect(MODEL_MAP['gpt-4']).toBeDefined();
    expect(MODEL_MAP['gpt-3.5-turbo']).toBeDefined();
  });

  it('should have reasoning models covered', () => {
    expect(MODEL_MAP['o3']).toBeDefined();
    expect(MODEL_MAP['o3-mini']).toBeDefined();
    expect(MODEL_MAP['o1']).toBeDefined();
    expect(MODEL_MAP['o1-mini']).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// AUDIT FIX TESTS: Regression tests for bugs found in audit
// ═══════════════════════════════════════════════════════════════════════

describe('Audit fix: resolveModel partial match ordering', () => {
  it('should match gpt-4o-mini-2025-new to gpt-4o-mini (not gpt-4o)', () => {
    // CRITICAL BUG FIX: gpt-4o-mini variants must match gpt-4o-mini, not gpt-4o
    const result = resolveModel('gpt-4o-mini-2025-new');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile'); // fast tier, not gemini-2.5-pro
  });

  it('should match gpt-4o-mini-2024-07-18 to gpt-4o-mini', () => {
    const result = resolveModel('gpt-4o-mini-2024-07-18');
    expect(result.provider).toBe('groq');
    expect(result.model).toBe('llama-3.3-70b-versatile');
  });
});

describe('Audit fix: tool_result → role:tool conversion', () => {
  it('should produce separate role:tool messages for each tool_result', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Read files' },
        {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'toolu_1', name: 'read_file', input: { path: 'a.ts' } },
            { type: 'tool_use', id: 'toolu_2', name: 'read_file', input: { path: 'b.ts' } },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'toolu_1', content: 'content of a' },
            { type: 'tool_result', tool_use_id: 'toolu_2', content: 'content of b' },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    const toolMessages = result.messages.filter(m => (m as any).role === 'tool');
    expect(toolMessages).toHaveLength(2);
    expect((toolMessages[0] as any).tool_call_id).toBe('toolu_1');
    expect((toolMessages[1] as any).tool_call_id).toBe('toolu_2');
  });

  it('should handle tool_result with array content', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Read' },
        {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'toolu_1', name: 'read_file', input: { path: 'a.ts' } },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'toolu_1', content: [{ type: 'text', text: 'file content' }] },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    const toolMsg = result.messages.find(m => (m as any).role === 'tool') as any;
    expect(toolMsg).toBeDefined();
    expect(toolMsg.content).toContain('file content');
  });
});

describe('Audit fix: thinking block handling', () => {
  it('should skip thinking blocks in user messages', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me think about this...' },
            { type: 'text', text: 'Here is my answer.' },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    const assistantMsg = result.messages.find(m => m.role === 'assistant') as any;
    // Thinking blocks should be stripped
    expect(assistantMsg.content).toBe('Here is my answer.');
    expect(assistantMsg.content).not.toContain('thinking');
  });

  it('should skip redacted_thinking blocks', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          content: [
            { type: 'redacted_thinking', data: 'encrypted...' },
            { type: 'text', text: 'Response' },
          ],
        },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    const assistantMsg = result.messages.find(m => m.role === 'assistant') as any;
    expect(assistantMsg.content).toBe('Response');
  });
});

describe('Audit fix: stop_sequences and tool_choice forwarding', () => {
  it('should forward stop_sequences as stop parameter', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      stop_sequences: ['END', 'STOP'],
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    expect(result.stop).toEqual(['END', 'STOP']);
  });

  it('should forward tool_choice auto', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      tool_choice: { type: 'auto' },
      tools: [{ name: 'test', description: 'test tool', input_schema: { type: 'object', properties: {} } }],
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    expect(result.tool_choice).toBe('auto');
  });

  it('should forward tool_choice any as required', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      tool_choice: { type: 'any' },
      tools: [{ name: 'test', description: 'test tool', input_schema: { type: 'object', properties: {} } }],
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    expect(result.tool_choice).toBe('required');
  });
});

describe('Audit fix: Anthropic response cache fields', () => {
  it('should include cache_creation_input_tokens and cache_read_input_tokens', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');
    expect(result.usage.cache_creation_input_tokens).toBe(0);
    expect(result.usage.cache_read_input_tokens).toBe(0);
  });
});

describe('Audit fix: malformed tool arguments', () => {
  it('should handle malformed JSON in tool_call arguments gracefully', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'llama-3.3-70b-versatile',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: { name: 'bash', arguments: 'not valid json{' },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };

    // Should not throw — malformed args are caught and put in _raw_arguments
    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');
    expect(result.content[0].type).toBe('tool_use');
    expect(result.content[0].input._raw_arguments).toBe('not valid json{');
  });
});

describe('Audit fix: single-object system prompt', () => {
  it('should handle system prompt as a single content block object', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      system: { type: 'text', text: 'You are a helpful assistant.' },
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    };

    const result = anthropicToOpenAI(anthropicReq);
    expect(result.messages[0]).toEqual({ role: 'system', content: 'You are a helpful assistant.' });
  });
});

describe('Audit fix: image block null safety', () => {
  it('should skip image blocks with undefined source', () => {
    const anthropicReq = {
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What is this?' },
          { type: 'image' }, // missing source — should not crash
        ],
      }],
    };

    const result = anthropicToOpenAI(anthropicReq);
    // Should only have the text, no crash
    expect(result.messages[0].content).toBe('What is this?');
  });
});

describe('Audit fix: request validation', () => {
  let server: any;
  const TEST_PORT = 9877;
  const BASE = `http://localhost:${TEST_PORT}`;

  beforeAll(async () => {
    server = startProxy(TEST_PORT);
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('should reject invalid temperature', async () => {
    const resp = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 5.0, // Invalid
      }),
    });

    expect(resp.status).toBe(400);
  });

  it('should reject non-array messages', async () => {
    const resp = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: 'not an array',
      }),
    });

    expect(resp.status).toBe(400);
  });

  it('should reject too many tools', async () => {
    const tools = Array.from({ length: 200 }, (_, i) => ({
      type: 'function',
      function: { name: `tool_${i}`, description: `Tool ${i}` },
    }));

    const resp = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
        tools,
      }),
    });

    expect(resp.status).toBe(400);
  });
});

describe('Audit fix: Anthropic response ID format', () => {
  it('should generate msg_ prefixed IDs with proper length', () => {
    const openaiResp = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      model: 'gemini-2.5-pro',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };

    const result = openAIToAnthropicResponse(openaiResp, 'claude-sonnet-4');
    expect(result.id).toMatch(/^msg_[A-Za-z0-9]{24}$/);
  });
});
