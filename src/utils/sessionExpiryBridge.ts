/**
 * Bridge for session expiry: when the API layer detects session expired (e.g. token
 * regeneration failed), it calls notifySessionExpired(). The handler registered here
 * should clear auth state and redirect to the Login screen.
 */
type SessionExpiredHandler = () => void | Promise<void>;

let handler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(fn: SessionExpiredHandler | null): void {
  handler = fn;
}

export function notifySessionExpired(): void {
  if (handler) {
    try {
      const result = handler();
      if (result instanceof Promise) {
        result.catch((err) => console.error('[sessionExpiryBridge] Handler error:', err));
      }
    } catch (err) {
      console.error('[sessionExpiryBridge] Handler error:', err);
    }
  }
}
