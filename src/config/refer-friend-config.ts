export type ReferFriendAddressField = 'building' | 'area' | 'location' | 'pincode';

export type ReferFriendField =
  | ReferFriendAddressField
  | 'firstName'
  | 'lastName'
  | 'mobileNumber'
  | 'email'
  | 'address1'
  | 'city';

export interface ReferFriendConfig {
  hiddenFields: ReferFriendAddressField[];
  optionalFields?: ReferFriendField[];
}

const DEFAULT_REFER_FRIEND_CONFIG: ReferFriendConfig = {
  hiddenFields: [],
  optionalFields: [],
};

const ADDRESS_FIELDS: ReferFriendAddressField[] = [
  'building',
  'area',
  'location',
  'pincode',
];

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

export const isReferFriendFieldVisible = (field: ReferFriendAddressField): boolean => {
  return !getReferFriendConfig().hiddenFields.includes(field);
};

export const isReferFriendFieldRequired = (field: ReferFriendField): boolean => {
  if (ADDRESS_FIELDS.includes(field as ReferFriendAddressField)) {
    if (!isReferFriendFieldVisible(field as ReferFriendAddressField)) {
      return false;
    }
  }
  return !(getReferFriendConfig().optionalFields ?? []).includes(field);
};
