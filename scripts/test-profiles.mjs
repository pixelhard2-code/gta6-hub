import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Start the isolated emulator first: npx firebase-tools emulators:exec --only firestore --project demo-gta6hub-follow --config tests/firebase.json 'npm run test:profiles'");
}

const build = mkdtempSync(join(tmpdir(), "gta6hub-profile-tests-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc", "app/lib/profile-actions.ts", "app/lib/avatars.ts",
    "--target", "ES2020", "--module", "commonjs", "--moduleResolution", "node",
    "--skipLibCheck", "--outDir", build,
  ], { stdio: "inherit" });
  symlinkSync(resolve("node_modules"), join(build, "node_modules"), "dir");
  execFileSync(process.execPath, ["--test", "tests/profile-actions.test.mjs"], {
    stdio: "inherit", env: { ...process.env, PROFILE_TEST_BUILD: build },
  });
} finally {
  rmSync(build, { recursive: true, force: true });
}
