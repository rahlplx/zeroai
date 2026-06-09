#!/usr/bin/env node
/**
 * ZeroAI — Zero-cost AI access from your terminal
 *
 * Usage:
 *   zeroai init          # Setup wizard (get free API keys)
 *   zeroai chat "Hello"  # Chat with best free model
 *   zeroai serve         # Run as MCP server
 *   zeroai models        # List available free models
 *   zeroai compare "Hi"  # Compare providers
 *   zeroai doctor        # Check your configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { PROVIDERS, getBestProvider, getFallbackChain, TaskType } from './config.js';
import { chat, compare } from './client.js';

const program = new Command();

program
  .name('zeroai')
  .description('0 Zero-cost AI access from your terminal — stacks 10+ free providers with smart routing')
  .version('1.0.0');

// ─── Init Command ────────────────────────────────────────────────────
program
  .command('init')
  .description('Setup wizard — guides you through getting free API keys')
  .action(async () => {
    console.log(chalk.bold.cyan('\n0 ZeroAI — Setup Wizard\n'));
    console.log('This wizard will help you get FREE API keys for each provider.\n');
    console.log(chalk.bold('None of these require a credit card!\n'));

    for (const provider of PROVIDERS.filter(p => p.id !== 'ollama')) {
      const hasKey = provider.apiKeyEnvVar && process.env[provider.apiKeyEnvVar];
      const status = hasKey ? chalk.green('✅ Configured') : chalk.yellow('⬜ Not set');

      console.log(chalk.bold(`\n${provider.name} ${status}`));
      console.log(`  Sign up: ${chalk.blue(provider.signupURL)}`);
      console.log(`  Env var: ${chalk.gray(provider.apiKeyEnvVar)}`);
      console.log(`  Free models: ${provider.freeModels.map(m => m.name).join(', ')}`);
      console.log(`  Rate limit: ${provider.rateLimit.rpm} RPM / ${provider.rateLimit.rpd} RPD`);
      console.log(`  ${chalk.gray(provider.notes)}`);
    }

    console.log(chalk.bold('\n\n📋 Quick Setup Commands:'));
    console.log(chalk.gray(`
  # Google AI Studio (Gemini) — Best free API
  export GOOGLE_AI_API_KEY="get-from https://aistudio.google.com/apikey"

  # Groq — Fastest inference
  export GROQ_API_KEY="get-from https://console.groq.com"

  # Mistral — Most generous free quota (~1B tokens/month)
  export MISTRAL_API_KEY="get-from https://console.mistral.ai"

  # Cerebras — Ultra-fast wafer-scale inference
  export CEREBRAS_API_KEY="get-from https://cloud.cerebras.ai"

  # OpenRouter — 27+ free models
  export OPENROUTER_API_KEY="get-from https://openrouter.ai"

  # DeepSeek — 5M free tokens on signup
  export DEEPSEEK_API_KEY="get-from https://platform.deepseek.com"

  # Add to ~/.bashrc or ~/.zshrc for persistence
    `));

    console.log(chalk.bold('🏠 Local AI (Unlimited, Private):'));
    console.log(chalk.gray(`
  # Install Ollama
  curl -fsSL https://ollama.com/install.sh | sh

  # Pull a model
  ollama pull llama3.3:70b    # Best quality (needs 32GB+ RAM)
  ollama pull qwen3:32b       # Good quality (needs 16GB+ RAM)
  ollama pull llama3.1:8b     # Fast, lower quality (needs 8GB+ RAM)
    `));
  });

// ─── Chat Command ────────────────────────────────────────────────────
program
  .command('chat <prompt>')
  .description('Chat with the best available free AI model')
  .option('-p, --provider <provider>', 'Specific provider (google, groq, mistral, cerebras, openrouter, deepseek, cohere, ollama)')
  .option('-m, --model <model>', 'Specific model ID')
  .option('-t, --task <task>', 'Task type (coding, reasoning, fast, long-context, vision, general)', 'general')
  .option('-s, --system <prompt>', 'System prompt')
  .action(async (prompt: string, options: any) => {
    try {
      const { provider, model, task, system } = options;

      // Show which provider we're using
      const best = getBestProvider(task as TaskType);
      const chosenProvider = provider || best.provider.id;
      const chosenModel = model || best.model.id;

      process.stderr.write(chalk.gray(`Using ${chosenProvider}/${chosenModel}...\n\n`));

      const result = await chat(prompt, {
        provider: chosenProvider,
        model: chosenModel,
        task: task as TaskType,
        systemPrompt: system,
      });

      console.log(result.text);

      process.stderr.write(chalk.gray(`\n[${result.provider}/${result.model} | ${(result.latencyMs / 1000).toFixed(1)}s${result.tokensUsed ? ` | ${result.tokensUsed.input + result.tokensUsed.output} tokens` : ''}]\n`));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// ─── Models Command ──────────────────────────────────────────────────
program
  .command('models')
  .description('List all available free AI models')
  .option('-a, --all', 'Show all providers (not just configured ones)')
  .action(async (options: any) => {
    const providers = options.all
      ? PROVIDERS
      : PROVIDERS.filter(p => !p.apiKeyEnvVar || !!process.env[p.apiKeyEnvVar] || p.id === 'ollama');

    console.log(chalk.bold.cyan('\n0 Available Free AI Models\n'));

    for (const provider of providers) {
      const hasKey = !provider.apiKeyEnvVar || !!process.env[provider.apiKeyEnvVar];
      const status = hasKey ? chalk.green('✅') : chalk.red('❌');

      console.log(`${status} ${chalk.bold(provider.name)} (${provider.id})`);
      console.log(`   ${chalk.gray(`Rate: ${provider.rateLimit.rpm} RPM / ${provider.rateLimit.rpd} RPD | No CC: ${!provider.requiresCreditCard ? 'Yes' : 'No'}`)}`);

      for (const model of provider.freeModels) {
        const caps = model.capabilities.map(c => {
          const icons: Record<string, string> = { chat: '💬', code: '💻', reasoning: '🧠', vision: '👁️', 'image-gen': '🎨', tools: '🔧' };
          return `${icons[c] || c} ${c}`;
        }).join(' ');

        const ctxStr = model.contextWindow >= 1_000_000 ? '1M' : `${model.contextWindow / 1000}K`;
        const speedEmoji = { ultra: '⚡', fast: '🏃', medium: '🚶', slow: '🐢' }[model.speed];

        console.log(`   ${chalk.blue(model.id)} — ${model.name}`);
        console.log(`     ${ctxStr} ctx | ${speedEmoji} ${model.speed} | ${model.quality} quality | ${caps}`);
      }
      console.log();
    }
  });

// ─── Compare Command ─────────────────────────────────────────────────
program
  .command('compare <prompt>')
  .description('Compare responses across multiple free providers')
  .option('-p, --providers <providers>', 'Comma-separated provider IDs')
  .action(async (prompt: string, options: any) => {
    console.log(chalk.bold.cyan(`\n🔄 Comparing responses for: "${prompt}"\n`));

    const providerList = options.providers?.split(',').map((p: string) => p.trim());
    const results = await compare(prompt, providerList);

    for (const result of results) {
      console.log(chalk.bold(`\n## ${result.provider} — ${result.model} (${(result.latencyMs / 1000).toFixed(1)}s)`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(result.response);
    }
  });

// ─── Serve Command (MCP Server) ──────────────────────────────────────
program
  .command('serve')
  .description('Run as MCP server (for Claude Code, Cursor, VS Code)')
  .action(async () => {
    // Import and run the MCP server
    await import('./mcp-server.js');
  });

// ─── Doctor Command ──────────────────────────────────────────────────
program
  .command('doctor')
  .description('Check your configuration and available providers')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🩺 ZeroAI — Health Check\n'));

    let configured = 0;
    let total = PROVIDERS.filter(p => p.id !== 'ollama').length;

    for (const provider of PROVIDERS) {
      if (provider.id === 'ollama') {
        // Check if Ollama is running
        try {
          const resp = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
          const data = await resp.json() as any;
          const modelCount = data.models?.length || 0;
          console.log(chalk.green(`✅ Ollama — Running (${modelCount} models loaded)`));
        } catch {
          console.log(chalk.yellow(`⬜ Ollama — Not running (install: https://ollama.com)`));
        }
        continue;
      }

      const hasKey = !!process.env[provider.apiKeyEnvVar];
      if (hasKey) {
        configured++;
        console.log(chalk.green(`✅ ${provider.name} — API key configured`));
        console.log(`   Models: ${provider.freeModels.map(m => m.name).join(', ')}`);
      } else {
        console.log(chalk.yellow(`⬜ ${provider.name} — Not configured`));
        console.log(`   Get free key: ${chalk.blue(provider.signupURL)}`);
        console.log(`   Set: export ${provider.apiKeyEnvVar}="your-key"`);
      }
    }

    console.log(chalk.bold(`\n📊 Status: ${configured}/${total} providers configured`));

    if (configured === 0) {
      console.log(chalk.red('\n⚠️  No providers configured! Run `zeroai init` to get started.'));
    } else if (configured < 3) {
      console.log(chalk.yellow('\n💡 Tip: Configure more providers for better fallback coverage.'));
    } else {
      console.log(chalk.green('\n🚀 You have excellent free AI coverage!'));
    }

    // Show smart routing info
    const tasks: TaskType[] = ['coding', 'reasoning', 'fast', 'long-context', 'vision', 'image-gen', 'tools', 'general'];
    console.log(chalk.bold('\n🧠 Smart Routing:'));
    for (const task of tasks) {
      const best = getBestProvider(task);
      const hasKey = !best.provider.apiKeyEnvVar || !!process.env[best.provider.apiKeyEnvVar];
      const icon = hasKey ? '✅' : '⚠️';
      console.log(`  ${icon} ${task.padEnd(15)} → ${best.provider.name} / ${best.model.name}`);
    }
  });

program.parse();
