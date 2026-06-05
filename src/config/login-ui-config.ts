/**
 * Clients where the "Login with OTP" toggle link should be hidden on the login screen.
 * OTP login can still be disabled server-side via isp_details auth_methods.
 */
export const CLIENTS_HIDING_OTP_LOGIN_LINK: readonly string[] = ['monarknet'];

export const shouldShowOtpLoginLink = (clientId: string): boolean =>
  !CLIENTS_HIDING_OTP_LOGIN_LINK.includes(clientId);
