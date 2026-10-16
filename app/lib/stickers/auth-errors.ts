export const FIREBASE_SETUP_ERRORS = [
  "firebase-admin-sdk", "firebase-admin-json", "firebase-admin-credential",
  "firebase-project-mismatch", "firebase-admin-permission", "firebase-auth-unavailable",
] as const;

export function buyerAuthFailure(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "auth/insufficient-permission") return "firebase-admin-permission";
  if (code === "app/invalid-credential" || code === "auth/invalid-credential") return "firebase-admin-credential";
  if (["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked", "auth/user-disabled", "auth/user-not-found"].includes(String(code))) return "unauthorized";
  return "firebase-auth-unavailable";
}

export function checkoutAuthAccess(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return FIREBASE_SETUP_ERRORS.some((item) => item === code) ? code : "session-invalid";
}

export function firebaseSdkFailure(error: unknown, module: "app" | "auth" | "firestore") {
  const failure = new Error("firebase-admin-sdk");
  const source = error && typeof error === "object" ? error as { code?: unknown; message?: unknown } : {};
  const codes = ["MODULE_NOT_FOUND", "ERR_MODULE_NOT_FOUND", "ERR_REQUIRE_ESM", "ERR_REQUIRE_ASYNC_MODULE", "ERR_PACKAGE_PATH_NOT_EXPORTED"];
  const code = codes.includes(String(source.code)) ? String(source.code) : "unknown";
  const missing = code === "MODULE_NOT_FOUND" && typeof source.message === "string" ? source.message.match(/^Cannot find module '(@?[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*)'/)?.[1] : undefined;
  return Object.assign(failure, { sdkDiagnostic: { module, code, ...(missing ? { dependency: missing } : {}) } });
}

export function firebaseSdkDiagnostic(error: unknown) {
  return error instanceof Error && error.message === "firebase-admin-sdk" && "sdkDiagnostic" in error ? error.sdkDiagnostic : undefined;
}
