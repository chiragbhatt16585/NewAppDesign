/**
 * Clients where the "Login with OTP" toggle link should be hidden on the login screen.
 * OTP login can still be disabled server-side via isp_details auth_methods.
 */
export const CLIENTS_HIDING_OTP_LOGIN_LINK: readonly string[] = ['monarknet'];

/**
 * Clients where OTP login is shown first; username/password is the secondary toggle option.
 */
export const CLIENTS_WITH_OTP_PRIMARY_LOGIN: readonly string[] = ['microscan', 'microscan-dptest'];

export const shouldShowOtpLoginLink = (clientId: string): boolean =>
  !CLIENTS_HIDING_OTP_LOGIN_LINK.includes(clientId);

export const getDefaultLoginMode = (clientId: string): 'password' | 'otp' =>
  CLIENTS_WITH_OTP_PRIMARY_LOGIN.includes(clientId) ? 'otp' : 'password';
