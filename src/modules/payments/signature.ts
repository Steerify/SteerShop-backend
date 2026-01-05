import crypto from "crypto";
import { paystackConfig } from "../../config/paystack";

/**
 * Verify Paystack signature using timing-safe comparison.
 * Returns true if signature matches expected HMAC-SHA512(JSON.stringify(payload)) hex digest.
 */
export function isValidPaystackSignature(
  payload: any,
  signature?: string
): boolean {
  if (!signature) return false;

  const expectedHex = crypto
    .createHmac("sha512", paystackConfig.secretKey)
    .update(JSON.stringify(payload))
    .digest("hex");

  const expected = Buffer.from(expectedHex, "hex");

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
  } catch (err) {
    provided = Buffer.alloc(0);
  }

  const providedForCompare =
    provided.length === expected.length
      ? provided
      : Buffer.alloc(expected.length);

  try {
    const equal = crypto.timingSafeEqual(expected, providedForCompare);
    return provided.length === expected.length && equal;
  } catch (err) {
    // If timingSafeEqual throws (shouldn't unless lengths differ drastically), treat as invalid
    return false;
  }
}
