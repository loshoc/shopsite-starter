/**
 * Stripe Checkout `expires_at` is a Unix timestamp and must fall between
 * 30 minutes and 24 hours after the session is created.
 * https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-expires_at
 *
 * Numeric values outside that window are clamped.
 * Non-numeric values (NaN, strings, undefined, null) fall back to 60 minutes
 * and warn. They do not throw.
 */

export const CHECKOUT_EXPIRY_MIN_MINUTES = 30;
export const CHECKOUT_EXPIRY_MAX_MINUTES = 24 * 60;
export const CHECKOUT_EXPIRY_DEFAULT_MINUTES = 60;

export function resolveCheckoutExpiryMinutes(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    console.warn(
      `checkoutExpiryMinutes must be a finite number of minutes (${CHECKOUT_EXPIRY_MIN_MINUTES}–${CHECKOUT_EXPIRY_MAX_MINUTES}). Using ${CHECKOUT_EXPIRY_DEFAULT_MINUTES}.`,
    );
    return CHECKOUT_EXPIRY_DEFAULT_MINUTES;
  }
  if (value < CHECKOUT_EXPIRY_MIN_MINUTES) return CHECKOUT_EXPIRY_MIN_MINUTES;
  if (value > CHECKOUT_EXPIRY_MAX_MINUTES) return CHECKOUT_EXPIRY_MAX_MINUTES;
  return value;
}

/** Unix seconds for Stripe Checkout `expires_at`. */
export function checkoutExpiresAt(nowUnixSeconds: number, minutes: unknown): number {
  const resolved = resolveCheckoutExpiryMinutes(minutes);
  const now = Number.isFinite(nowUnixSeconds) ? Math.floor(nowUnixSeconds) : Math.floor(Date.now() / 1000);
  return now + Math.round(resolved * 60);
}

export function checkoutExpiresAtFromConfig(
  config: { checkoutExpiryMinutes?: unknown },
  nowUnixSeconds: number,
): number {
  return checkoutExpiresAt(nowUnixSeconds, config.checkoutExpiryMinutes);
}
