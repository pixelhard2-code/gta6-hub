import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const build = mkdtempSync(join(tmpdir(), "leonidacrew-milestone-"));
try {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "app/components/giveaway-milestone/model.ts", "--target", "ES2020", "--module", "commonjs", "--strict", "--skipLibCheck", "--outDir", build], { stdio: "inherit" });
  execFileSync(process.execPath, ["--test", "tests/giveaway-milestone.test.mjs"], { stdio: "inherit", env: { ...process.env, MILESTONE_TEST_BUILD: build } });
} finally { rmSync(build, { recursive: true, force: true }); }
