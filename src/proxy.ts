/**
 * ZeroAI Transparent Proxy — Entry Point
 * Re-exports everything from proxy-core.ts for use as a module.
 */

export { startProxy, resolveModel, MODEL_MAP, anthropicToOpenAI, openAIToAnthropicResponse, callFreeProvider } from './proxy-core.js';
