import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Run with the isolated demo-gta6hub-follow Firestore emulator.");
const build = mkdtempSync(join(tmpdir(), "leonidacrew-sticker-tests-"));
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "app/lib/stickers/commerce.ts", "app/lib/stickers/reconciliation.ts", "app/lib/stickers/manual.ts", "app/lib/stickers/email-transport.ts", "app/lib/stickers/checkout-policy.ts", "--target", "ES2020", "--module", "commonjs", "--moduleResolution", "node", "--esModuleInterop", "--skipLibCheck", "--outDir", build], { stdio: "inherit" });
  symlinkSync(resolve("node_modules"), join(build, "node_modules"), "dir");
  execFileSync(process.execPath, ["--test", "tests/stickers.test.mjs"], { stdio: "inherit", env: { ...process.env, STICKER_TEST_BUILD: build } });
} finally { rmSync(build, { recursive: true, force: true }); }
