import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { execFileSync } from "node:child_process";

function load(path, dependencies = {}, env = {}, runtime = {}) {
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, process: { env }, Error, Response,
    require: (name) => {
      if (!(name in dependencies)) throw new Error("Dependency unavailable");
      return dependencies[name];
    },
    ...runtime,
  });
  return module.exports;
}

const catalog = load("app/lib/stickers/catalog.ts");
const policy = load("app/lib/stickers/checkout-policy.ts");
const errors = load("app/lib/stickers/auth-errors.ts");
const paymentErrors = load("app/lib/stickers/payment-errors.ts");
const account = { project_id: "demo-auth", client_email: "server@example.invalid", private_key: "example\\nkey" };

test("the actual Firebase SDK loads and rejects invalid tokens with Vercel's configured Node flag", () => {
  const script = `
    const { generateKeyPairSync } = require('node:crypto');
    const { cert, initializeApp, deleteApp } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getFirestore } = require('firebase-admin/firestore');
    (async () => {
      const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      const app = initializeApp({ credential: cert({ projectId: 'demo-auth', clientEmail: 'test@example.invalid', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }) }) });
      getFirestore(app);
      let rejected = false;
      try { await getAuth(app).verifyIdToken('invalid-token', true); }
      catch (error) { rejected = error.code === 'auth/argument-error'; }
      await deleteApp(app);
      if (!rejected) throw new Error('Invalid token was not rejected');
      console.log('sdk-ready');
    })().catch(() => process.exit(1));
  `;
  const output = execFileSync(process.execPath, ["--experimental-require-module", "-e", script], { encoding: "utf8" });
  assert.equal(output.trim(), "sdk-ready");
});

function server({ env = {}, verify = async () => ({ uid: "buyer", email_verified: true }), sdk = true, fetch = async () => { throw new Error("Unexpected network request"); } } = {}) {
  let savedAccount;
  const result = load("app/lib/stickers/server.ts", {
    "server-only": {}, "./catalog": catalog, "./checkout-policy": policy, "./auth-errors": errors, "./payment-errors": paymentErrors,
    ...(sdk ? {
      "firebase-admin/app": { getApps: () => [], cert: (value) => { savedAccount = value; return {}; }, initializeApp: () => ({}) },
      "firebase-admin/auth": { getAuth: () => ({ verifyIdToken: verify }) },
      "firebase-admin/firestore": { getFirestore: () => ({}) },
    } : {}),
  }, { FIREBASE_ADMIN_SERVICE_ACCOUNT: JSON.stringify(account), NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-auth", ...env }, { fetch, AbortSignal });
  return { ...result, savedAccount: () => savedAccount };
}

test("the trial accepts any verified identity and does not require an email allowlist", () => {
  assert.equal(policy.checkoutPolicy({ MERCADOPAGO_MODE: "test", STICKER_TEST_ENABLED: "true" }).enabled, true);
  for (const email of ["first@example.com", "second@example.com"]) {
    assert.equal(policy.testBuyerAccess({ email, email_verified: true }), "ready");
  }
  assert.equal(policy.testBuyerAccess({ email_verified: false }), "email-unverified");
  assert.equal(policy.checkoutPolicy({ MERCADOPAGO_MODE: "production", STICKER_TEST_ENABLED: "true" }).enabled, false);
});

test("Admin JSON, project mismatch and missing SDK are server failures, not session failures", () => {
  assert.throws(() => server({ env: { FIREBASE_ADMIN_SERVICE_ACCOUNT: "private-value-not-json" } }).stickerAdmin(), /^Error: firebase-admin-json$/);
  assert.throws(() => server({ env: { NEXT_PUBLIC_FIREBASE_PROJECT_ID: "another-project" } }).stickerAdmin(), /^Error: firebase-project-mismatch$/);
  assert.throws(() => server({ sdk: false }).stickerAdmin(), /^Error: firebase-admin-sdk$/);
  const valid = server(); valid.stickerAdmin();
  assert.equal(valid.savedAccount().private_key, "example\nkey");
});

test("token revocation remains enforced and provider faults never expose private errors", async () => {
  const request = new Request("https://example.com", { headers: { Authorization: "Bearer example-token" } });
  const valid = server({ verify: async (token, checkRevoked) => {
    assert.equal(token, "example-token"); assert.equal(checkRevoked, true);
    return { uid: "verified-buyer", email_verified: true };
  } });
  assert.equal((await valid.authenticatedBuyer(request)).uid, "verified-buyer");
  for (const [code, expected] of [["auth/id-token-revoked", "unauthorized"], ["auth/insufficient-permission", "firebase-admin-permission"], ["app/invalid-credential", "firebase-admin-credential"], ["unknown", "firebase-auth-unavailable"]]) {
    const broken = server({ verify: async () => { throw { code, message: "DO-NOT-EXPOSE-PRIVATE-DATA" }; } });
    await assert.rejects(broken.authenticatedBuyer(request), new RegExp("^Error: " + expected + "$"));
    const response = broken.apiError(new Error(expected));
    assert.equal((await response.text()).includes("DO-NOT-EXPOSE"), false);
  }
});

test("SDK diagnostics report only the dependency category and omit raw errors and paths", () => {
  const missing = errors.firebaseSdkFailure({ code: "MODULE_NOT_FOUND", message: "Cannot find module '@example/dependency'\nPRIVATE-DETAIL" }, "auth");
  assert.equal(JSON.stringify(errors.firebaseSdkDiagnostic(missing)), JSON.stringify({ module: "auth", code: "MODULE_NOT_FOUND", dependency: "@example/dependency" }));
  const privatePath = errors.firebaseSdkFailure({ code: "MODULE_NOT_FOUND", message: "Cannot find module '/private/value'" }, "app");
  assert.equal(JSON.stringify(errors.firebaseSdkDiagnostic(privatePath)).includes("private"), false);
  const unknown = errors.firebaseSdkFailure({ code: "PRIVATE-DETAIL", message: "PRIVATE-DETAIL" }, "firestore");
  assert.equal(JSON.stringify(errors.firebaseSdkDiagnostic(unknown)).includes("PRIVATE"), false);
});

test("provider failures keep actionable status codes and never return the private provider response", async () => {
  for (const [status, expected] of [[401, "payment-provider-auth"], [403, "payment-provider-auth"], [404, "payment-provider-not-found"], [429, "payment-provider-busy"], [400, "payment-provider-request"], [503, "payment-provider-failed"]]) {
    const instance = server({ env: { MERCADOPAGO_ACCESS_TOKEN: "local-fake-token" }, fetch: async () => Response.json({ message: "PRIVATE-PROVIDER-DATA" }, { status }) });
    let failure;
    try { await instance.mercadoPago("/v1/payments/123"); } catch (error) { failure = error; }
    assert.equal(failure.message, expected);
    const response = await instance.apiError(failure).json();
    assert.equal(response.code, expected);
    assert.equal(JSON.stringify(response).includes("PRIVATE-PROVIDER-DATA"), false);
    assert.equal(JSON.stringify(response).includes("local-fake-token"), false);
  }
});

test("checkout status separates server setup from invalid sessions and blocks anonymous trial access", async () => {
  let failure, buyer = { uid: "buyer", email_verified: true };
  const route = load("app/api/stickers/checkout/route.ts", {
    "@/app/lib/stickers/namespace": {}, "@/app/lib/stickers/commerce": {},
    "@/app/lib/stickers/catalog": catalog, "@/app/lib/stickers/checkout-policy": policy,
    "@/app/lib/stickers/auth-errors": errors,
    "@/app/lib/stickers/server": {
      commerceConfig: () => ({ ready: true, liveMode: false, currency: "CLP", amounts: { basic: 3000, double: 5000, legend: 10000 } }),
      stickerAdmin: () => { if (failure) throw new Error(failure); return {}; },
      authenticatedBuyer: async () => buyer,
    },
  });
  for (const [expected, authenticated] of [["sign-in-required", false], ["ready", true]]) {
    const response = await route.GET(new Request("https://example.com", { headers: authenticated ? { Authorization: "Bearer token" } : {} }));
    const result = await response.json();
    assert.equal(result.access, expected);
    assert.equal(result.automatic, authenticated);
    if (!authenticated) assert.deepEqual(result.quotes, []);
  }
  for (const code of ["firebase-admin-json", "firebase-admin-sdk", "firebase-project-mismatch", "unauthorized"]) {
    failure = code;
    const result = await (await route.GET(new Request("https://example.com"))).json();
    assert.equal(result.access, code === "unauthorized" ? "session-invalid" : code);
    assert.equal(result.automatic, false); assert.deepEqual(result.quotes, []);
  }
});
