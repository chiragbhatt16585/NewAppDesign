type UsageDetail = {
  plan_days?: string | number | null;
  days_used?: string | number | null;
};

const parseUsageNumber = (value: string | number | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const trimmed = value.trim();
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

export default getSafeDaysRemaining;

