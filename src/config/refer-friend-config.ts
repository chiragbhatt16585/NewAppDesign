export type ReferFriendField = 'building' | 'area' | 'location' | 'pincode';

export interface ReferFriendConfig {
  hiddenFields: ReferFriendField[];
  optionalFields?: ReferFriendField[];
}

const DEFAULT_REFER_FRIEND_CONFIG: ReferFriendConfig = {
  hiddenFields: [],
  optionalFields: [],
};

export const getReferFriendConfig = (): ReferFriendConfig => {
  try {
    const config = require('./refer-friend-fields.json') as ReferFriendConfig;
    if (!config || !Array.isArray(config.hiddenFields)) {
      return DEFAULT_REFER_FRIEND_CONFIG;
    }
    return config;
  } catch {
    return DEFAULT_REFER_FRIEND_CONFIG;
  }
};

export const isReferFriendFieldVisible = (field: ReferFriendField): boolean => {
  return !getReferFriendConfig().hiddenFields.includes(field);
};

export const isReferFriendFieldRequired = (field: ReferFriendField): boolean => {
  if (!isReferFriendFieldVisible(field)) {
    return false;
  }
  return !(getReferFriendConfig().optionalFields ?? []).includes(field);
};
