/**
 * MCP Server — Exposes all free AI providers as MCP tools
 * Following the stitch-mcp architecture pattern:
 *   1. Discover available tools (per provider)
 *   2. Register them as MCP tools
 *   3. Add virtual tools that compose atomic operations
 *   4. Forward requests with automatic fallback
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PROVIDERS, getBestProvider, getFallbackChain, TaskType } from './config.js';
import { chat, compare } from './client.js';

const server = new McpServer({
  name: "zeroai",
  version: "1.0.0",
});

// ─── Tool 1: Smart Chat (auto-routes to best free provider) ──────────
server.tool(
  "chat",
  "Chat with the best available free AI model. Automatically routes to the optimal provider based on your task type.",
  {
    prompt: z.string().describe("Your message/question"),
    task: z.enum(['coding', 'reasoning', 'fast', 'long-context', 'vision', 'image-gen', 'tools', 'general'])
      .default('general')
      .describe("Type of task to optimize provider selection"),
    system_prompt: z.string().optional().describe("System prompt to set context"),
    model: z.string().optional().describe("Specific model ID to use"),
    provider: z.string().optional().describe("Specific provider ID (google, groq, mistral, cerebras, openrouter, deepseek, cohere, ollama)"),
  },
  async ({ prompt, task, system_prompt, model, provider }) => {
    const result = await chat(prompt, {
      task: task as TaskType,
      systemPrompt: system_prompt,
      model,
      provider,
    });

    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// ─── Tool 2: Code Review (optimized for coding tasks) ────────────────
server.tool(
  "code_review",
  "Get code review from a free AI model optimized for coding tasks.",
  {
    code: z.string().describe("The code to review"),
    language: z.string().optional().describe("Programming language"),
    focus: z.string().optional().describe("What to focus on (bugs, performance, style, security)"),
  },
  async ({ code, language, focus }) => {
    const systemPrompt = `You are an expert code reviewer. Review the provided ${language || ''} code${focus ? ` focusing on ${focus}` : ''}. 
Give specific, actionable feedback with line references where possible.`;

    const result = await chat(`Review this code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``, {
      task: 'coding',
      systemPrompt,
    });

    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// ─── Tool 3: Deep Reasoning (uses best free reasoning model) ──────────
server.tool(
  "reason",
  "Use a reasoning-optimized model (DeepSeek R1, Gemini 2.5 Pro) for complex analysis.",
  {
    question: z.string().describe("The complex question or problem to reason about"),
    context: z.string().optional().describe("Additional context or constraints"),
  },
  async ({ question, context }) => {
    const prompt = context ? `${question}\n\nContext: ${context}` : question;
    const result = await chat(prompt, {
      task: 'reasoning',
      systemPrompt: 'Think step by step. Show your reasoning process before giving the final answer.',
    });

    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// ─── Tool 4: Fast Response (optimized for speed) ─────────────────────
server.tool(
  "quick",
  "Get a fast response using the quickest available free model (Groq or Cerebras).",
  {
    prompt: z.string().describe("Your question"),
  },
  async ({ prompt }) => {
    const result = await chat(prompt, { task: 'fast' });
    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// ─── Tool 5: Compare Providers (virtual tool — stitch-mcp pattern) ───
server.tool(
  "compare",
  "Compare responses across multiple free AI providers side-by-side.",
  {
    prompt: z.string().describe("The prompt to send to all providers"),
    providers: z.string().optional().describe("Comma-separated provider IDs to compare (default: top 4)"),
  },
  async ({ prompt, providers }) => {
    const providerList = providers?.split(',').map(p => p.trim());
    const results = await compare(prompt, providerList);

    const formatted = results.map(r =>
      `## ${r.provider} — ${r.model} (${(r.latencyMs / 1000).toFixed(1)}s)\n\n${r.response}`
    ).join('\n\n---\n\n');

    return {
      content: [{
        type: "text" as const,
        text: formatted,
      }],
    };
  }
);

// ─── Tool 6: List Available Free Models ──────────────────────────────
server.tool(
  "list_models",
  "List all available free AI models and their capabilities.",
  {},
  async () => {
    const available = PROVIDERS.filter(p => {
      if (p.id === 'ollama') return true;
      return !p.apiKeyEnvVar || !!process.env[p.apiKeyEnvVar];
    });

    const lines = available.map(p => {
      const models = p.freeModels.map(m =>
        `  - ${m.name} (${m.id}) [${m.capabilities.join(', ')}] ~${m.contextWindow >= 1000000 ? '1M' : `${m.contextWindow / 1000}K`} ctx, ${m.speed} speed, ${m.quality} quality`
      ).join('\n');
      return `### ${p.name} (${p.id})\n${!p.requiresCreditCard ? '✅ No credit card' : '⚠️ Requires CC'} | Rate: ${p.rateLimit.rpm} RPM / ${p.rateLimit.rpd} RPD\n${models}`;
    }).join('\n\n');

    return {
      content: [{
        type: "text" as const,
        text: `# Free AI Models Available\n\n${lines}`,
      }],
    };
  }
);

// ─── Tool 7: Multi-Model Consensus (virtual tool) ────────────────────
server.tool(
  "consensus",
  "Get answers from multiple free models and find the consensus/best answer. Great for important decisions.",
  {
    question: z.string().describe("The question to ask multiple models"),
    min_providers: z.number().default(3).describe("Minimum number of providers to query"),
  },
  async ({ question, min_providers }) => {
    const chain = getFallbackChain('general');
    const targets = chain.slice(0, Math.min(min_providers, chain.length));

    const responses = await Promise.allSettled(
      targets.map(async ({ provider, model }) => {
        const result = await chat(question, {
          provider: provider.id,
          model: model.id,
          maxRetries: 1,
        });
        return { provider: provider.name, model: model.name, text: result.text };
      })
    );

    const successful = responses
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    // Use the first successful response to synthesize consensus
    if (successful.length === 0) {
      return {
        content: [{ type: "text" as const, text: "All providers failed. Try again later." }],
      };
    }

    const consensusPrompt = `Given these responses from different AI models, synthesize the best answer:

${successful.map((r, i) => `### Model ${i + 1}: ${r.provider} (${r.model})\n${r.text}`).join('\n\n---\n\n')}

Provide a single, comprehensive answer that incorporates the best insights from all models.`;

    const final = await chat(consensusPrompt, { task: 'reasoning' });

    return {
      content: [{
        type: "text" as const,
        text: final.text,
      }],
    };
  }
);

// ─── Tool 8: Image Generation (via Gemini free tier) ─────────────────
server.tool(
  "generate_image",
  "Generate an image using Gemini's free image generation (500-1000 images/day free).",
  {
    prompt: z.string().describe("Description of the image to generate"),
  },
  async ({ prompt }) => {
    const result = await chat(
      `Generate an image of: ${prompt}`,
      { task: 'image-gen', provider: 'google', model: 'gemini-2.5-flash' }
    );

    return {
      content: [{
        type: "text" as const,
        text: result.text,
      }],
    };
  }
);

// ─── Start the MCP server ────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("0 ZeroAI MCP Server running on stdio");
}

main().catch(console.error);
