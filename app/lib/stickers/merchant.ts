export interface VerifiedMerchant {
  collectorId: string;
  liveMode: boolean;
  testAccount: boolean;
}

/** Use only the /users/me response fetched with the server's Mercado Pago token. */
export function verifyMerchantAccount(account: unknown, expected: { collectorId: string; liveMode: boolean }): VerifiedMerchant {
  const seller = account as { id?: unknown; tags?: unknown } | null;
  if (!seller || !/^\d+$/.test(expected.collectorId) || String(seller.id) !== expected.collectorId) throw new Error("merchant-mismatch");
  if (!Array.isArray(seller.tags) || !seller.tags.every((tag) => typeof tag === "string")) throw new Error("merchant-environment-unverified");
  const testAccount = seller.tags.includes("test_user");
  if (testAccount === expected.liveMode) throw new Error("merchant-mode-mismatch");
  return { collectorId: expected.collectorId, liveMode: expected.liveMode, testAccount };
}

export function paymentEnvironmentMatches(liveMode: unknown, merchant: VerifiedMerchant) {
  // Checkout Pro test accounts also operate on the production API. Their trusted
  // test_user identity selects our isolated trial ledger, not the payment flag.
  // Real sellers still require a production payment; missing flags fail closed.
  return typeof liveMode === "boolean" && merchant.testAccount === !merchant.liveMode
    && (merchant.testAccount || liveMode === true);
}
