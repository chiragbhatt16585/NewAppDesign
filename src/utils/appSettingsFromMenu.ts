export function tryParseDisplayOptionJson(jsonVal: unknown): Record<string, any> {
  if (!jsonVal) return {};
  if (typeof jsonVal === 'object' && !Array.isArray(jsonVal)) {
    return jsonVal as Record<string, any>;
  }
  if (typeof jsonVal === 'string') {
    const trimmed = jsonVal.trim();
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
      return {};
    }
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Settings menu `display_option_json` → `app_settings` (or legacy `settings`). */
export function getAppSettingsFromMenu(menu: any[] | null | undefined): Record<string, any> | null {
  if (!Array.isArray(menu)) {
    //console.log('[AppSettingsFromMenu] menu is not an array:', menu);
    return null;
  }

  //console.log('[AppSettingsFromMenu] full menu array:', JSON.stringify(menu, null, 2));

  const entry =
    menu.find((m: any) => String(m?.menu_label).trim().toLowerCase() === 'settings') ||
    menu.find((m: any) => {
      const parsed = tryParseDisplayOptionJson(m?.display_option_json);
      return !!parsed?.settings || !!parsed?.app_settings;
    });

  if (!entry) {
    //console.log('[AppSettingsFromMenu] no Settings menu entry found');
    return null;
  }

  //console.log('[AppSettingsFromMenu] Settings menu entry:', JSON.stringify(entry, null, 2));

  const parsed = tryParseDisplayOptionJson(entry.display_option_json);
  //console.log('[AppSettingsFromMenu] parsed display_option_json:', JSON.stringify(parsed, null, 2));

  const base = parsed?.app_settings || parsed?.settings;
  // API may place fix_your_internet at root of display_option_json, outside app_settings.
  const appSettings =
    base || parsed?.fix_your_internet !== undefined
      ? { ...(base || {}), ...(parsed?.fix_your_internet !== undefined ? { fix_your_internet: parsed.fix_your_internet } : {}) }
      : null;

  //console.log('[AppSettingsFromMenu] app_settings / settings:', JSON.stringify(appSettings, null, 2));
  // console.log(
  //   '[AppSettingsFromMenu] fix_your_internet:',
  //   appSettings?.fix_your_internet,
  //   '| enabled:',
  //   isFixYourInternetEnabled(appSettings),
  // );

  return appSettings;
}

/** Show Fix Your Internet when `fix_your_internet` is explicitly true (inside or outside `app_settings`). */
export function isFixYourInternetEnabled(
  appSettings: Record<string, any> | null | undefined,
): boolean {
  if (!appSettings) return false;

  const flag = appSettings.fix_your_internet;

  if (typeof flag === 'boolean') return flag;
  if (flag && typeof flag === 'object' && typeof flag.show === 'boolean') {
    return flag.show;
  }

  return false;
}
