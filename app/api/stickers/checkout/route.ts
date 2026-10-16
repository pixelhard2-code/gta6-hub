import { stickerCollection } from "@/app/lib/stickers/namespace";
import { authenticatedBuyer, commerceConfig, mercadoPago, stickerAdmin, appUrl, apiError } from "@/app/lib/stickers/server";
import { getStickerPackage, STICKER_PACKAGES, validDeliveryEmail } from "@/app/lib/stickers/catalog";
import { createStickerOrder, prepareStickerCheckout } from "@/app/lib/stickers/commerce";
import { allowedTestBuyer, testBuyerAccess } from "@/app/lib/stickers/checkout-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = commerceConfig();
  let access = config.ready ? "ready" : "setup-required";
  if (config.ready && !config.liveMode) {
    if (!request.headers.has("authorization")) access = "sign-in-required";
    else {
      try { access = testBuyerAccess(await authenticatedBuyer(request), config.testEmail); }
      catch { access = "session-invalid"; }
    }
  }
  const allowed = access === "ready";
  return Response.json({ automatic: allowed, testMode: allowed && !config.liveMode, access, quotes: allowed ? STICKER_PACKAGES.map((pack) => ({ id: pack.id, amount: config.amounts[pack.id], currency: config.currency })) : [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const config = commerceConfig();
    if (!config.ready) throw new Error("setup-required");
    const buyer = await authenticatedBuyer(request);
    if (!buyer.email_verified) throw new Error("unauthorized");
    if (!config.liveMode && !allowedTestBuyer(buyer, config.testEmail)) throw new Error("test-not-allowed");
    const body = await request.json();
    if (body.expectedMode === "test" && config.liveMode) throw new Error("test-unavailable");
    const pack = getStickerPackage(body.packageId);
    if (!pack) throw new Error("invalid-package");
    if (!validDeliveryEmail(body.email)) throw new Error("invalid-email");
    const { db } = stickerAdmin();
    const merchant = await mercadoPago("/users/me");
    if (String(merchant.id) !== config.collectorId) throw new Error("merchant-mismatch");
    const limitRef = db.collection(stickerCollection("sticker_checkout_limits")).doc(buyer.uid);
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(limitRef);
      const now = Date.now();
      const sameWindow = now - Number(snap.data()?.start || 0) < 60000;
      const count = sameWindow ? Number(snap.data()?.count || 0) : 0;
      if (count >= 6) throw new Error("too-many-attempts");
      transaction.set(limitRef, { start: sameWindow ? snap.data()!.start : now, count: count + 1 });
    });
    const { id, order } = await createStickerOrder(db, { uid: buyer.uid, email: body.email, packageId: pack.id, attemptId: body.attemptId, amount: config.amounts[pack.id], currency: config.currency });
    if (order.status === "approved") return Response.json({ orderId: id, url: `${appUrl()}/compra?orden=${id}` });
    const base = appUrl();
    const checkoutUrl = await prepareStickerCheckout(db, id, async (savedOrder) => {
      const preference = await mercadoPago("/checkout/preferences", {
        method: "POST", body: JSON.stringify({
          items: [{ id: pack.id, title: `${pack.name}: ${pack.stickers} stickers digitales LeonidaCrew`, quantity: 1, currency_id: savedOrder.currency, unit_price: savedOrder.amount }],
          payer: config.liveMode ? { email: savedOrder.email } : undefined, external_reference: id,
          notification_url: `${base}/api/stickers/webhook?source_news=webhooks`,
          back_urls: { success: `${base}/compra?orden=${id}`, pending: `${base}/compra?orden=${id}`, failure: `${base}/compra?orden=${id}` },
          auto_return: "approved", binary_mode: false,
          metadata: { order_id: id, package_id: pack.id },
        }),
      });
      // Test seller accounts use init_point too; the credentials select the mode.
      const destination = new URL(preference.init_point);
      if (destination.protocol !== "https:" || !/(^|\.)mercadopago\.(cl|com|com\.ar|com\.mx|com\.br)$/.test(destination.hostname)) throw new Error("invalid-checkout-url");
      return { preferenceId: String(preference.id), checkoutUrl: destination.href };
    });
    return Response.json({ orderId: id, url: checkoutUrl });
  } catch (error) { return apiError(error); }
}
