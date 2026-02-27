export type UsageDetail = {
  plan_days?: string | number | null;
  days_used?: string | number | null;
  days_remaining?: string | number | null;
  validity?: string | number | null;
  remaining_days?: string | number | null;
};

export const parseUsageNumber = (value: string | number | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const getSafeDaysRemaining = (
  usageDetail?: UsageDetail,
  fallback: string = '-',
): string => {
  if (!usageDetail) {
    return fallback;
  }

  const planDays = parseUsageNumber(usageDetail.plan_days);
  const daysUsed = parseUsageNumber(usageDetail.days_used);

  if (planDays === undefined || daysUsed === undefined) {
    return fallback;
  }

  const remaining = planDays - daysUsed;
  if (!Number.isFinite(remaining)) {
    return fallback;
  }

  return `${Math.max(Math.round(remaining), 0)}`;
};

/**
 * Get days remaining as a number (for calculations).
 * Prefers days_remaining if API provides it, else computes from plan_days - days_used.
 */
export const getDaysRemainingNumber = (
  usageDetail?: UsageDetail,
  authData?: { total_days?: string | number | null },
): number => {
  if (!usageDetail) {
    const totalDays = parseUsageNumber(authData?.total_days);
    return totalDays ?? 0;
  }

  // Prefer days_remaining / remaining_days if API provides it directly
  const directRemaining =
    parseUsageNumber(usageDetail.days_remaining) ??
    parseUsageNumber(usageDetail.remaining_days);
  if (directRemaining !== undefined && directRemaining >= 0) {
    return Math.round(directRemaining);
  }

  const planDays = parseUsageNumber(usageDetail.plan_days);
  const daysUsed = parseUsageNumber(usageDetail.days_used) ?? 0;

  // When plan_days is "Unlimited" or missing, use total_days as validity
  if (planDays === undefined) {
    const totalDays = parseUsageNumber(authData?.total_days);
    if (totalDays !== undefined) {
      return Math.max(Math.round(totalDays - daysUsed), 0);
    }
    return 0;
  }

  const remaining = planDays - daysUsed;
  if (!Number.isFinite(remaining)) {
    const totalDays = parseUsageNumber(authData?.total_days);
    return totalDays !== undefined ? Math.max(Math.round(totalDays - daysUsed), 0) : 0;
  }

  return Math.max(Math.round(remaining), 0);
};

export default getSafeDaysRemaining;

