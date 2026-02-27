import { LLM_CONFIG } from '../config/llm-config';
import { getDaysRemainingNumber, parseUsageNumber } from '../utils/usageUtils';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  /** Suggested quick actions extracted from response (optional) */
  suggestedActions?: string[];
}

const SUGGESTED_ACTIONS = [
  'Pay Now',
  'View Bill Details',
  'Upgrade Plan',
  'View Plans',
  'Report Issue',
  'Contact Support',
  'Renew Plan',
  'Check Usage',
];

/**
 * Check if LLM is configured and available
 */
export function isLLMEnabled(): boolean {
  return !!(LLM_CONFIG.enabled && LLM_CONFIG.apiKey?.trim());
}

/**
 * Check if demo mode is active (no API key + demoMode enabled)
 */
export function isDemoMode(): boolean {
  return !!(LLM_CONFIG.demoMode && !LLM_CONFIG.apiKey?.trim());
}

/**
 * Simulated LLM responses with dummy data - for previewing the AI chat experience without an API key.
 */
export function getDemoResponse(userMessage: string, userData?: any): LLMResponse {
  const q = userMessage.toLowerCase();

  // Use real data if available, else dummy
  const plan = userData?.currentPlan || 'Premium 100GB';
  const price = userData?.planPrice || '₹1,200';
  const dues = userData?.paymentDues || '450';
  const usageDetails = userData?.usage_details?.[0];
  const dataUsed = usageDetails?.data_used || '0';
  const dataAllotted = usageDetails?.plan_data || '100 GB';
  const daysUsed = parseInt(usageDetails?.days_used || '18');
  const daysAllotted = parseInt(usageDetails?.plan_days || '30');
  const dataUsedGB = (parseFloat(dataUsed) / (1024 * 1024 * 1024)).toFixed(2);
  const isUnlimited = dataAllotted === 'Unlimited';
  const planDataGB = isUnlimited ? 'Unlimited' : dataAllotted;
  const daysRemaining = daysAllotted - daysUsed;
  const usagePct = isUnlimited ? 0 : (parseFloat(dataUsed) / (1024 * 1024 * 1024) / parseFloat(planDataGB.split(' ')[0] || '100')) * 100;

  if (q.includes('bill') || q.includes('pay') || q.includes('due') || q.includes('payment')) {
    return {
      text: `I can help with your bill! 💳\n\nYour current plan **${plan}** costs ${price}/month. You have **₹${dues}** in pending dues.\n\nYou can pay via:\n• **Pay Now** in the app (card, UPI, net banking)\n• **Auto-pay** – set it up to avoid late fees\n• Visit any authorized payment center\n\nWould you like to pay now?`,
      suggestedActions: ['Pay Now', 'View Bill Details', 'Set Auto-Pay'],
    };
  }

  if (q.includes('upgrade') || q.includes('plan') || q.includes('higher') || q.includes('more data')) {
    return {
      text: `Great! Let me show you options based on your usage. 📊\n\n**Current usage:** ${dataUsedGB} GB / ${planDataGB} (${usagePct.toFixed(0)}%)\n**Plan:** ${plan} (${price})\n\n**Upgrade options:**\n• 150GB – ₹1,600/month\n• 200GB – ₹1,800/month\n• Unlimited – ₹2,000/month\n\nWhich plan interests you?`,
      suggestedActions: ['150GB Plan', '200GB Plan', 'Unlimited Plan', 'Compare Plans'],
    };
  }

  if (q.includes('slow') || q.includes('internet') || q.includes('speed') || q.includes('connectivity')) {
    return {
      text: `Sorry to hear about the slow internet! 🔧\n\n**Quick checks:**\n1. Restart your router\n2. Check if other devices are affected\n3. Test at speedtest.net\n\nNo outages reported in your area. If it persists, I can help you raise a ticket for our support team.`,
      suggestedActions: ['Run Diagnostic', 'Report Issue', 'Contact Human Agent'],
    };
  }

  if (q.includes('usage') || q.includes('data') || q.includes('how much') || q.includes('consumed')) {
    return {
      text: `Here’s your usage status: 📈\n\n**Data:** ${dataUsedGB} GB / ${planDataGB}\n**Days left:** ${daysRemaining}\n**Daily average:** ${(parseFloat(dataUsedGB) / Math.max(daysUsed, 1)).toFixed(2)} GB\n\n${usagePct > 80 ? '⚠️ You’re on track to exceed your plan. Consider upgrading.' : '✅ Usage is within normal range.'}\n\nNeed more details or want to upgrade?`,
      suggestedActions: ['Upgrade Plan', 'View Details', 'Set Usage Alerts'],
    };
  }

  if (q.includes('renew') || q.includes('expire') || q.includes('expiry') || q.includes('when') && q.includes('plan')) {
    const expDate = userData?.exp_date ?? userData?.expiry_date ?? 'N/A';
    return {
      text: `Your **${plan}** expires on **${expDate}** (${daysRemaining} days remaining).\n\nRenew now to avoid service interruption. You can renew from the app or pay your dues to extend automatically.`,
      suggestedActions: ['Renew Plan', 'Pay Now', 'View Bill Details'],
    };
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return {
      text: `Hi! 👋 I’m your AI assistant. I can help with bills, plans, usage, upgrades, or technical issues. What would you like to know?`,
      suggestedActions: ['Bill Payment', 'Plan Upgrade', 'Technical Issue', 'Usage Query'],
    };
  }

  // Default for any other query - shows LLM-style natural response
  return {
    text: `I’d be happy to help! 🤖\n\nI can assist with:\n• **Bills** – pay, view dues, set auto-pay\n• **Plans** – upgrade, downgrade, renew\n• **Usage** – data usage, limits, alerts\n• **Technical** – slow internet, connectivity, tickets\n\nYour current plan: **${plan}** (${price}). What would you like to do?`,
    suggestedActions: ['Pay Now', 'Upgrade Plan', 'Check Usage', 'Report Issue', 'Talk to Human'],
  };
}

/**
 * Build system prompt with user context for ISP support
 */
function buildSystemPrompt(userContext: string): string {
  return `You are a warm, knowledgeable AI support assistant for an ISP (Internet Service Provider) customer app in India. You help customers with bills, plans, usage, and technical issues.

PERSONALITY:
- Friendly, empathetic, and professional
- Proactive – offer helpful suggestions before they ask
- Use their name or "you" naturally
- Be conversational, not robotic
- Use emojis sparingly (1-2 per response) for warmth

${userContext ? `CUSTOMER'S ACTUAL DATA (ALWAYS use this – it's real data from their account):\n${userContext}\n\nWhen they ask about bills, plans, or usage – use these exact numbers. Don't make up data.` : 'No customer data available – ask them to check the app or provide general guidance.'}

RESPONSE STYLE:
- Answer the question directly first, then add helpful details
- For bills: mention their exact dues, plan name, and payment options
- For usage: give their exact data used, limit, and days remaining
- For plan expiry/expiration: ALWAYS include the exact Expiry Date (exp_date) if available – e.g. "Your plan expires on 15-Mar-2025" – plus days remaining
- For plans: reference their current plan and suggest relevant upgrades/downgrades
- Keep responses 2-4 short paragraphs – helpful but not overwhelming
- End with a clear next step or question when appropriate

ACTIONS YOU CAN SUGGEST (they appear as buttons):
Pay Now, View Bill Details, Upgrade Plan, Renew Plan, Check Usage, Report Issue, Contact Support

Never say you cannot help – always offer a path forward.`;
}

/**
 * Build user context string from auth/usage data
 * Handles various API field names (current_plan, currentPlan, plan_price, etc.)
 */
export function buildUserContext(userData: any): string {
  if (!userData) return '';

  const usageDetails = userData?.usage_details?.[0];
  const dataUsed = usageDetails?.data_used || '0';
  const dataAllotted = usageDetails?.plan_data || userData?.dataAllotted || '100 GB';
  const daysUsed = parseUsageNumber(usageDetails?.days_used) ?? 0;
  const daysAllotted = parseUsageNumber(usageDetails?.plan_days) ?? parseUsageNumber(userData?.plan_days) ?? 30;

  const dataUsedGB = (parseFloat(String(dataUsed)) / (1024 * 1024 * 1024)).toFixed(2);
  const isUnlimited = dataAllotted === 'Unlimited';
  const planDataGB = isUnlimited ? 'Unlimited' : dataAllotted;
  const daysRemaining = getDaysRemainingNumber(usageDetails, userData);
  const dailyAvg = daysUsed > 0 ? (parseFloat(String(dataUsed)) / (1024 * 1024 * 1024) / daysUsed).toFixed(2) : '0';

  const planName = userData.currentPlan || userData.current_plan || usageDetails?.plan_name || usageDetails?.current_plan || 'N/A';
  const rawPrice = userData.planPrice ?? userData.plan_price ?? usageDetails?.plan_price ?? 'N/A';
  const planPrice = rawPrice === 'N/A' || rawPrice == null ? 'N/A' : (String(rawPrice).startsWith('₹') ? rawPrice : `₹${rawPrice}`);
  const paymentDues = userData.paymentDues ?? userData.payment_dues ?? userData.user_payment_dues ?? '0';
  const customerName = userData.full_name || [userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.username || '';

  const expDate = (userData.exp_date ?? userData.expiry_date ?? usageDetails?.exp_date ?? usageDetails?.plan_end_date ?? '').toString().trim();
  const renewDate = (userData.renew_date ?? userData.renewal_date ?? '').toString().trim();

  const lines: string[] = [
    `Customer: ${customerName || 'N/A'}`,
    `Current plan: ${planName} (${planPrice})`,
    `Expiry date: ${expDate || 'N/A'} (IMPORTANT – always show this when user asks about plan expiry)`,
    renewDate ? `Renewal date: ${renewDate}` : null,
    `Payment dues: ₹${paymentDues}`,
    `Data usage: ${dataUsedGB} GB / ${planDataGB}`,
    `Days used: ${daysUsed} of ${daysAllotted} (${daysRemaining} days remaining)`,
    `Daily average: ${dailyAvg} GB`,
  ].filter(Boolean);

  if (userData.plan_download_speed_in_mb || usageDetails?.speed) {
    lines.push(`Speed: ${userData.plan_download_speed_in_mb || usageDetails?.speed || 'N/A'} Mbps`);
  }

  return lines.join('\n');
}

/**
 * Call OpenAI Chat Completions API
 */
export async function getLLMResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userContext: string
): Promise<LLMResponse> {
  if (!isLLMEnabled()) {
    throw new Error('LLM not configured');
  }

  const systemPrompt = buildSystemPrompt(userContext);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Last 10 messages for context
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: LLM_CONFIG.maxTokens,
      temperature: 0.75,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = `OpenAI API error: ${response.status}`;
    try {
      const errJson = JSON.parse(errBody);
      errMsg = errJson.error?.message || errMsg;
    } catch {
      errMsg = errBody || errMsg;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || 'I apologize, I could not generate a response. Please try again.';

  return {
    text,
    suggestedActions: SUGGESTED_ACTIONS, // Could parse from response in future
  };
}
