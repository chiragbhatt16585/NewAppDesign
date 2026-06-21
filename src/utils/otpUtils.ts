const OTP_MAX_LENGTH = 8;

/**
 * Extract OTP from SMS text or autofill input.
 * Handles messages like: "026538 is your OTP for username 1010221212. Thanks."
 */
export function extractOtpFromText(
  raw: string,
  knownUsernames: Array<string | null | undefined> = [],
): string {
  const text = raw.trim();
  if (!text) {
    return '';
  }

  const normalizedUsernames = knownUsernames
    .map(u => u?.trim().replace(/\D/g, '') || '')
    .filter(Boolean);

  // "026538 is your OTP for username …"
  const leadingOtpMatch = text.match(/^(\d{4,8})\s+is\s+your\s+otp\b/i);
  if (leadingOtpMatch) {
    return leadingOtpMatch[1];
  }

  // "Your OTP is 026538" / "OTP: 026538"
  const labeledOtpMatch = text.match(/\bOTP\b[:\s]+(\d{4,8})\b/i);
  if (labeledOtpMatch) {
    return labeledOtpMatch[1];
  }

  const digitsOnly = text.replace(/\D/g, '');

  // Reject username/mobile mistaken as OTP (e.g. 10-digit autofill)
  if (
    digitsOnly &&
    normalizedUsernames.some(u => u === digitsOnly || digitsOnly.endsWith(u))
  ) {
    return '';
  }

  if (digitsOnly.length > OTP_MAX_LENGTH) {
    // Autofill grabbed a long number — try leading segment before "is your OTP"
    const embedded = text.match(/(\d{4,8})\s+is\s+your\s+otp/i);
    if (embedded) {
      return embedded[1];
    }
    return '';
  }

  return digitsOnly;
}
