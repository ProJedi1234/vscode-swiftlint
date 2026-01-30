import { spawn, type ChildProcess } from "node:child_process";
import { swiftlintPath, toolchainPath } from "./config";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdin?: string;
  signal?: AbortSignal;
}

const activeProcesses = new Set<ChildProcess>();

export function killAllProcesses(): void {
  for (const proc of activeProcesses) {
    proc.kill();
  }
  activeProcesses.clear();
}

export function execSwiftlint(
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const bin = swiftlintPath();
    const env = { ...process.env, ...options.env };

    const tc = toolchainPath();
    if (tc) {
      env["TOOLCHAINS"] = tc;
    }

    const child = spawn(bin, args, {
      cwd: options.cwd,
      env,
      shell: process.platform === "win32",
      stdio: ["pipe", "pipe", "pipe"],
    });

    activeProcesses.add(child);
    let settled = false;

    const onAbort = () => {
      child.kill();
      if (settled) return;
      settled = true;
      activeProcesses.delete(child);
      reject(new DOMException("Aborted", "AbortError"));
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });

    if (options.stdin && child.stdin) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    }

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      activeProcesses.delete(child);
      options.signal?.removeEventListener("abort", onAbort);
      if (settled) return;
      settled = true;
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.on("error", (err) => {
      activeProcesses.delete(child);
      options.signal?.removeEventListener("abort", onAbort);
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}
