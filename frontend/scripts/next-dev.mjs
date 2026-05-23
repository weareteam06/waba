import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const clean = process.argv.includes("--clean");
const devDist = resolve(process.cwd(), ".next-dev");

if (clean) {
  rmSync(devDist, { recursive: true, force: true });
}

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev"], {
  env: {
    ...process.env,
    NEXT_DIST_DIR: ".next-dev",
  },
  stdio: "inherit",
  windowsHide: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
