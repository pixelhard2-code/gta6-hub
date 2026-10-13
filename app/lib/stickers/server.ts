import "server-only";
import { STICKER_PACKAGES } from "./catalog";

// Keep Admin SDK loading synchronous for Node.js/serverless entry points.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { cert, getApps, initializeApp } = require("firebase-admin/app") as typeof import("firebase-admin/app");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");

export function adminConfigured() {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY));
}

export function stickerAdmin() {
  if (!adminConfigured()) throw new Error("setup-required");
  let app = getApps().find((item) => item.name === "sticker-commerce");
  if (!app) {
    const account = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) : {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };
    app = initializeApp({ credential: cert(account) }, "sticker-commerce");
  }
  return { auth: getAuth(app), db: getFirestore(app) };
}

export async function authenticatedBuyer(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("unauthorized");
  try { return await stickerAdmin().auth.verifyIdToken(token, true); }
  catch { throw new Error("unauthorized"); }
}

export function commerceConfig() {
  const currency = process.env.MERCADOPAGO_CURRENCY || "";
  const amounts = Object.fromEntries(STICKER_PACKAGES.map((pack) => [pack.id, Number(process.env[`MERCADOPAGO_PACK_${pack.id.toUpperCase()}_AMOUNT`])]));
  const pricesValid = ["CLP", "USD"].includes(currency) && Object.values(amounts).every((amount) => Number.isFinite(amount) && amount > 0 && (currency !== "CLP" || Number.isInteger(amount)));
  const ready = process.env.STICKER_SALES_ENABLED === "true" && adminConfigured() && pricesValid && Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET && process.env.MERCADOPAGO_COLLECTOR_ID && process.env.RESEND_API_KEY && process.env.STICKER_EMAIL_FROM && process.env.APP_URL);
  return { ready, currency, amounts, collectorId: process.env.MERCADOPAGO_COLLECTOR_ID || "", liveMode: process.env.MERCADOPAGO_MODE !== "test" };
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
  const status = code === "unauthorized" ? 401 : ["invalid-order", "invalid-email", "invalid-package", "conflicting-order"].includes(code) ? 400 : code === "checkout-busy" ? 409 : code === "too-many-attempts" ? 429 : code === "setup-required" ? 503 : 500;
  return Response.json({ code: status === 500 ? "request-failed" : code, message: status === 401 ? "Inicia sesión para continuar." : status === 503 ? "La entrega automática aún está en preparación." : "No se pudo completar la solicitud. Inténtalo nuevamente." }, { status });
}
