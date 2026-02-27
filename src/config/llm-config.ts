/**
 * LLM Chat Configuration
 *
 * Add your OpenAI API key to enable AI-powered chat.
 * Get your key at: https://platform.openai.com/api-keys
 *
 * ⚠️ SECURITY: Never commit your API key. Add this file to .gitignore
 * or use environment variables for production.
 */
export const LLM_CONFIG = {
  /** Set to true only when a key is provided via env or secure storage. */
  enabled: false,
  /** Your OpenAI API key. NEVER commit a real key here. */
  apiKey: '',
  /** When true and no apiKey: shows simulated AI responses with dummy data so you can preview the experience. */
  demoMode: true,
  /** Model: gpt-4o = best quality, gpt-4o-mini = cheaper but good */
  model: 'gpt-4o',
  /** Max tokens – higher = longer, more detailed responses */
  maxTokens: 600,
};
