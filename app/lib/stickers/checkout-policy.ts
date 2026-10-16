export function checkoutPolicy(env: Record<string, string | undefined> = process.env) {
  const liveMode = env.MERCADOPAGO_MODE !== "test";
  const enabled = env.MERCADOPAGO_MODE === "production"
    ? env.STICKER_SALES_ENABLED === "true"
    : env.MERCADOPAGO_MODE === "test" && env.STICKER_TEST_ENABLED === "true";
  return { liveMode, enabled };
}

export function testBuyerAccess(buyer: { email_verified?: boolean }) {
  return buyer.email_verified === true ? "ready" : "email-unverified";
}
