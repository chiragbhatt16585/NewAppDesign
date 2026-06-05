import { TroubleshootingConfig } from '../types/troubleshooting';

const CONFIG_JSON_KEYS = [
  'config_value',
  'config_data',
  'value',
  'runtime_config',
  'config',
  'user_self_diagnosis',
];

function isValidTroubleshootingConfig(value: unknown): value is TroubleshootingConfig {
  const cfg = value as TroubleshootingConfig;
  return !!cfg && Array.isArray(cfg.flows) && cfg.flows.length > 0;
}

function tryParseJsonString(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function extractConfigCandidate(raw: unknown): unknown {
  if (!raw) return null;
  if (typeof raw === 'string') return tryParseJsonString(raw);
  if (typeof raw !== 'object' || Array.isArray(raw)) return raw;

  const obj = raw as Record<string, unknown>;
  if (isValidTroubleshootingConfig(obj)) return obj;

  for (const key of CONFIG_JSON_KEYS) {
    const nested = obj[key];
    if (!nested) continue;
    if (typeof nested === 'string') {
      const parsed = tryParseJsonString(nested);
      if (parsed) return parsed;
    } else if (typeof nested === 'object') {
      return nested;
    }
  }

  return obj;
}

function normalizeTroubleshootingConfig(value: unknown): TroubleshootingConfig | null {
  const candidate = extractConfigCandidate(value);
  if (isValidTroubleshootingConfig(candidate)) {
    return candidate;
  }
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>;
    const nestedCandidates = [record.app_settings, record.data, record.result, record.payload];
    for (const nested of nestedCandidates) {
      const parsed = normalizeTroubleshootingConfig(nested);
      if (parsed) return parsed;
    }
  }
  return null;
}

/** Parse selfcareFetchCrmRuntimeConfigs response into TroubleshootingConfig. */
export function parseTroubleshootingRuntimeConfig(
  apiData: unknown,
  configName = 'user_self_diagnosis',
): TroubleshootingConfig | null {
  if (!apiData) return null;

  const direct = normalizeTroubleshootingConfig(apiData);
  if (direct) return direct;

  let entries: unknown[] = Array.isArray(apiData) ? apiData : [apiData];
  const namedEntry = entries.find(entry => {
    if (!entry || typeof entry !== 'object') return false;
    const name = String((entry as Record<string, unknown>).config_name ?? '').trim();
    return name === configName;
  });
  if (namedEntry) entries = [namedEntry];

  for (const entry of entries) {
    const parsed = normalizeTroubleshootingConfig(entry);
    if (parsed) return parsed;
  }

  return null;
}
