import { validDeliveryEmail } from "./catalog";

export function checkoutPolicy(env: Record<string, string | undefined> = process.env) {
  const liveMode = env.MERCADOPAGO_MODE !== "test";
  const testEmail = (env.STICKER_TEST_BUYER_EMAIL || "").trim().toLowerCase();
  const enabled = env.MERCADOPAGO_MODE === "production"
    ? env.STICKER_SALES_ENABLED === "true"
    : env.MERCADOPAGO_MODE === "test" && env.STICKER_TEST_ENABLED === "true" && validDeliveryEmail(testEmail);
  return { liveMode, enabled, testEmail };
}

export function allowedTestBuyer(buyer: { email?: string; email_verified?: boolean }, email: string) {
  return Boolean(email && buyer.email_verified === true && buyer.email?.trim().toLowerCase() === email);
}
