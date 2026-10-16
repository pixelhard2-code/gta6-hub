import "server-only";
import { STICKER_PACKAGES } from "./catalog";
import { checkoutPolicy } from "./checkout-policy";
import { buyerAuthFailure, FIREBASE_SETUP_ERRORS } from "./auth-errors";

export function adminConfigured() {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY));
}

export function stickerAdmin() {
  if (!adminConfigured()) throw new Error("setup-required");
  try { return initializeStickerAdmin(); }
  catch (error) {
    if (error instanceof Error && FIREBASE_SETUP_ERRORS.some((code) => code === error.message)) throw error;
    throw new Error("firebase-admin-credential");
  }
}

function initializeStickerAdmin() {
  // Load the private SDK only when credentials are available and needed.
  let appSdk: typeof import("firebase-admin/app"), authSdk: typeof import("firebase-admin/auth"), firestoreSdk: typeof import("firebase-admin/firestore");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    appSdk = require("firebase-admin/app");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    authSdk = require("firebase-admin/auth");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    firestoreSdk = require("firebase-admin/firestore");
  } catch { throw new Error("firebase-admin-sdk"); }
  const { cert, getApps, initializeApp } = appSdk;
  const { getAuth } = authSdk;
  const { getFirestore } = firestoreSdk;
  let app = getApps().find((item) => item.name === "sticker-commerce");
  if (!app) {
    let account;
    try { account = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) : {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }; } catch { throw new Error("firebase-admin-json"); }
    if (!account || typeof account !== "object" || Array.isArray(account)) throw new Error("firebase-admin-json");
    for (const key of ["private_key", "privateKey"]) {
      if (typeof account[key] === "string") account[key] = account[key].replace(/\\n/g, "\n");
    }
    const projectId = account.project_id || account.projectId;
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && projectId && projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error("firebase-project-mismatch");
    app = initializeApp({ credential: cert(account) }, "sticker-commerce");
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}

export async function authenticatedBuyer(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("unauthorized");
  const { auth } = stickerAdmin();
  try { return await auth.verifyIdToken(token, true); }
  catch (error) { throw new Error(buyerAuthFailure(error)); }
}

export function commerceConfig() {
  const policy = checkoutPolicy();
  const currency = process.env.MERCADOPAGO_CURRENCY || "";
  const amounts = Object.fromEntries(STICKER_PACKAGES.map((pack) => [pack.id, Number(process.env[`MERCADOPAGO_PACK_${pack.id.toUpperCase()}_AMOUNT`])]));
  const pricesValid = ["CLP", "USD"].includes(currency) && Object.values(amounts).every((amount) => Number.isFinite(amount) && amount > 0 && (currency !== "CLP" || Number.isInteger(amount)));
  const ready = policy.enabled && adminConfigured() && pricesValid && Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET && process.env.MERCADOPAGO_COLLECTOR_ID && process.env.RESEND_API_KEY && process.env.STICKER_EMAIL_FROM && process.env.APP_URL);
  return { ready, currency, amounts, collectorId: process.env.MERCADOPAGO_COLLECTOR_ID || "", liveMode: policy.liveMode };
}

export function appUrl() {
  const url = new URL(process.env.APP_URL || "https://gta6-hub-coral.vercel.app");
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("invalid-app-url");
  return url.origin;
}

export async function mercadoPago(path: string, init?: RequestInit) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) throw new Error("setup-required");
  const response = await fetch(`https://api.mercadopago.com${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) throw new Error("payment-provider-failed");
  return response.json();
}

export function apiError(error: unknown) {
  const code = error instanceof Error ? error.message : "unknown";
  const status = code === "unauthorized" ? 401 : code === "test-not-allowed" ? 403 : ["invalid-order", "invalid-email", "invalid-package", "conflicting-order"].includes(code) ? 400 : ["checkout-busy", "test-unavailable"].includes(code) ? 409 : code === "too-many-attempts" ? 429 : ["setup-required", "merchant-mismatch", ...FIREBASE_SETUP_ERRORS].includes(code) ? 503 : 500;
  return Response.json({ code: status === 500 ? "request-failed" : code, message: status === 401 ? "Inicia sesión para continuar." : code === "test-not-allowed" ? "Esta cuenta no tiene acceso a la prueba de pago." : code === "test-unavailable" ? "La prueba está desactivada. No se ha creado ningún pago." : code === "merchant-mismatch" ? "El Access Token no corresponde al vendedor configurado. Revisa las credenciales en Vercel." : status === 503 ? "La entrega automática aún está en preparación." : "No se pudo completar la solicitud. Inténtalo nuevamente." }, { status, headers: { "Cache-Control": "no-store" } });
}
