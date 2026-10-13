import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const build = mkdtempSync(join(tmpdir(), "leonidacrew-purchase-requests-"));
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "app/lib/stickers/purchase-request.ts", "--target", "ES2020", "--module", "commonjs", "--moduleResolution", "node", "--skipLibCheck", "--outDir", build], { stdio: "inherit" });
  execFileSync(process.execPath, ["--test", "tests/purchase-requests.test.mjs"], { stdio: "inherit", env: { ...process.env, PURCHASE_REQUEST_TEST_BUILD: build } });
} finally { rmSync(build, { recursive: true, force: true }); }
