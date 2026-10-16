// Merchant-only operation: verify the receipt's buyer before assigning a UID.
// Uses private credentials. This is deliberately not a public HTTP endpoint.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const require = createRequire(import.meta.url);
const [paymentId, uid, packageId, email] = process.argv.slice(2);
if (!paymentId || !uid || !packageId || !email) throw new Error("Usage: node scripts/reconcile-direct-sticker-payment.mjs PAYMENT_ID FIREBASE_UID basic|double|legend DELIVERY_EMAIL");
require("@next/env").loadEnvConfig(process.cwd());
if (!/^\d+$/.test(paymentId)) throw new Error("Invalid operation number");
const build = mkdtempSync(join(tmpdir(), "leonidacrew-reconcile-"));
let app, db;
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "app/lib/stickers/commerce.ts", "app/lib/stickers/email-transport.ts", "--target", "ES2020", "--module", "commonjs", "--moduleResolution", "node", "--esModuleInterop", "--skipLibCheck", "--outDir", build], { stdio: "inherit" });
  symlinkSync(resolve("node_modules"), join(build, "node_modules"), "dir");
  const { getStickerPackage, validDeliveryEmail } = require(join(build, "catalog.js"));
  const { applyVerifiedPayment, deliverStickerOrder } = require(join(build, "commerce.js"));
  const { stickerCollection } = require(join(build, "namespace.js"));
  const { sendStickerEmailWithConfig } = require(join(build, "email-transport.js"));
  const pack = getStickerPackage(packageId);
  if (!pack || !validDeliveryEmail(email)) throw new Error("Invalid package or delivery email");
  for (const name of ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_COLLECTOR_ID", "MERCADOPAGO_CURRENCY", "RESEND_API_KEY", "STICKER_EMAIL_FROM"]) if (!process.env[name]) throw new Error(`Missing ${name}`);
  const amount = Number(process.env[`MERCADOPAGO_PACK_${packageId.toUpperCase()}_AMOUNT`]);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Configure the actual package price first");
  const { initializeApp, cert, deleteApp } = require("firebase-admin/app");
  const account = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) : { projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g,"\n") };
  app = initializeApp({ credential: cert(account) }, "sticker-reconcile");
  db = require("firebase-admin/firestore").getFirestore(app);
  await require("firebase-admin/auth").getAuth(app).getUser(uid);
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Could not verify the payment");
  const payment = await response.json();
  if (String(payment.id) !== paymentId || payment.status !== "approved" || Number(payment.transaction_amount_refunded || 0) > 0 || String(payment.collector_id) !== process.env.MERCADOPAGO_COLLECTOR_ID || payment.currency_id !== process.env.MERCADOPAGO_CURRENCY || Math.abs(payment.transaction_amount - amount) > .000001 || payment.live_mode !== (process.env.MERCADOPAGO_MODE !== "test")) throw new Error("The payment does not match the seller, pack price, currency or environment");
  if (/^lc_/.test(payment.external_reference || "")) throw new Error("This payment belongs to an integrated checkout; process its original order");
  const id = "lc_" + createHash("sha256").update(`direct:${paymentId}`).digest("hex").slice(0,32);
  const ref = db.collection(stickerCollection("sticker_orders")).doc(id);
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      if (existing.data().uid !== uid || existing.data().email !== email.toLowerCase() || existing.data().packageId !== packageId) throw new Error("Payment already attributed to another buyer or pack");
    } else transaction.create(ref, { uid, email: email.toLowerCase(), packageId, quantity: pack.stickers, amount, currency: payment.currency_id, status: "pending", createdAt: Date.now(), source: "direct-link-merchant-review" });
  });
  await applyVerifiedPayment(db, { ...payment, external_reference: id }, { collectorId: process.env.MERCADOPAGO_COLLECTOR_ID, liveMode: process.env.MERCADOPAGO_MODE !== "test" });
  const sent = await deliverStickerOrder(db,id,job => sendStickerEmailWithConfig(job, { apiKey: process.env.RESEND_API_KEY, from: process.env.STICKER_EMAIL_FROM, testMode: process.env.MERCADOPAGO_MODE === "test", appUrl: process.env.APP_URL || "https://gta6-hub-coral.vercel.app" }));
  console.log(`Verified purchase credited. Order: ${id}. Email sent now: ${sent}.`);
  await db.terminate(); db = undefined; await deleteApp(app); app = undefined;
} finally {
  if(db) await db.terminate();
  if(app) await require("firebase-admin/app").deleteApp(app);
  rmSync(build,{recursive:true,force:true});
}
