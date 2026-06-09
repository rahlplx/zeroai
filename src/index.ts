/**
 * ZeroAI — Public API
 *
 * Re-exports the core functionality for use as a library.
 */

export { startProxy, resolveModel, MODEL_MAP, anthropicToOpenAI, openAIToAnthropicResponse, callFreeProvider } from './proxy-core.js';
export { PROVIDERS, getBestProvider, getFallbackChain } from './config.js';
export type { FreeProvider, FreeModel, TaskType } from './config.js';
export { chat, compare } from './client.js';
