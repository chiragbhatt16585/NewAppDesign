/**
 * Copy this file to llm-config.ts and add your OpenAI API key.
 * Get your key at: https://platform.openai.com/api-keys
 *
 * Add llm-config.ts to .gitignore to avoid committing your key.
 */
export const LLM_CONFIG = {
  enabled: true,
  apiKey: '', // e.g. 'sk-proj-...'
  model: 'gpt-4o-mini',
  maxTokens: 400,
};
