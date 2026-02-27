# 🤖 LLM-Powered AI Chat Setup

The ISP app supports **real AI-powered chat** using OpenAI's API. When configured, the chat understands natural language and provides personalized responses using your account data.

## Quick Setup

### 1. Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-`)

### 2. Add Your Key to the App

Edit `src/config/llm-config.ts`:

```typescript
export const LLM_CONFIG = {
  enabled: true,
  apiKey: 'sk-your-key-here',  // Paste your key
  model: 'gpt-4o-mini',        // Cost-effective; use 'gpt-4o' for better quality
  maxTokens: 400,
};
```

### 3. Run the App

The AI chat will now use the LLM. Navigate to **More Options** → **AI Assistant** (or **AI Demo** → **AI Support Chat**).

## Behavior

| Config | Behavior |
|--------|----------|
| `enabled: true` + valid `apiKey` | Uses OpenAI for natural language responses |
| `enabled: false` or empty `apiKey` | Falls back to keyword-based chat (bill, upgrade, usage, etc.) |

## Fallback

If the LLM fails (network error, invalid key, rate limit), the app automatically falls back to the keyword-based chat. No user-facing error.

## Cost

- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Typical chat message: ~500 tokens total ≈ $0.0005 per exchange
- For production, consider a backend proxy to hide your API key and add rate limiting.

## Security

⚠️ **Never commit your API key to git.** Options:

1. Add `src/config/llm-config.ts` to `.gitignore` (create from `llm-config.example.ts`)
2. Use a backend proxy: your app calls your server, which calls OpenAI
3. For production, use environment variables or a secrets manager

## Optional: Backend Proxy

For production, create an endpoint on your backend that:

1. Receives `{ messages, userContext }` from the app
2. Calls OpenAI with your server-side API key
3. Returns the response

Then update `llmService.ts` to call your endpoint instead of OpenAI directly.
