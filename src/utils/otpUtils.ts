const OTP_LENGTH = 6;

export const OTP_DIGIT_COUNT = OTP_LENGTH;

const normalizeDigits = (value?: string | null) => value?.trim().replace(/\D/g, '') || '';

/** Only purely numeric usernames (e.g. 10106543751) are compared against autofill. */
const getNumericUsername = (username?: string | null) => {
  const trimmed = username?.trim() || '';
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return '';
  }
  return trimmed;
};

const isLikelyUsernameNotOtp = (
  digitsOnly: string,
  knownUsernames: Array<string | null | undefined>,
): boolean => {
  const numericUsernames = knownUsernames.map(getNumericUsername).filter(Boolean);
  if (!digitsOnly || numericUsernames.length === 0) {
    return false;
  }

  return numericUsernames.some((username) => {
    if (digitsOnly === username) {
      return true;
    }
    // iOS may autofill the username and maxLength truncates it (e.g. 10106543751 -> 101065).
    if (username.startsWith(digitsOnly) || digitsOnly.startsWith(username)) {
      return true;
    }
    if (digitsOnly.endsWith(username) || username.endsWith(digitsOnly)) {
      return true;
    }
    return false;
  });
};

/**
 * Extract OTP from SMS text or autofill input.
 * Handles messages like: "310580 is your OTP for user name 10106543751. Thanks"
 */
export function extractOtpFromText(
  raw: string,
  knownUsernames: Array<string | null | undefined> = [],
): string {
  const text = raw.trim();
  if (!text) {
    return '';
  }

  // "310580 is your OTP for user name …"
  const leadingOtpMatch = text.match(new RegExp(`^(\\d{${OTP_LENGTH}})\\s+is\\s+your\\s+otp\\b`, 'i'));
  if (leadingOtpMatch) {
    return leadingOtpMatch[1];
  }

  // Full SMS pasted/autofilled with OTP embedded before username number.
  const embeddedOtpMatch = text.match(new RegExp(`(\\d{${OTP_LENGTH}})\\s+is\\s+your\\s+otp\\b`, 'i'));
  if (embeddedOtpMatch) {
    return embeddedOtpMatch[1];
  }

  // "Your OTP is 310580" / "OTP: 310580"
  const labeledOtpMatch = text.match(new RegExp(`\\bOTP\\b[:\\s]+(\\d{${OTP_LENGTH}})\\b`, 'i'));
  if (labeledOtpMatch) {
    return labeledOtpMatch[1];
  }

  const digitsOnly = normalizeDigits(text);

  if (isLikelyUsernameNotOtp(digitsOnly, knownUsernames)) {
    return '';
  }

  // Usernames/mobile numbers are 9-11 digits; OTP is always 6 digits.
  if (digitsOnly.length > OTP_LENGTH) {
    return '';
  }

  // Allow partial digits while the user types manually (1–6).
  if (digitsOnly.length > 0 && digitsOnly.length <= OTP_LENGTH) {
    return digitsOnly;
  }

  return '';
}
