import * as vscode from "vscode";
import * as fs from "node:fs";
import { execSwiftlint, type ExecOptions } from "./process";
import { additionalParameters, configSearchPaths } from "./config";

interface SwiftLintViolation {
  character: number | null;
  file: string;
  line: number;
  reason: string;
  rule_id: string;
  severity: "Warning" | "Error";
  type: string;
}

function parseViolations(json: string): SwiftLintViolation[] {
  if (!json.trim()) return [];
  try {
    return JSON.parse(json) as SwiftLintViolation[];
  } catch {
    return [];
  }
}

function toDiagnostic(v: SwiftLintViolation): vscode.Diagnostic {
  const line = Math.max(0, v.line - 1);
  const col = Math.max(0, (v.character ?? 1) - 1);
  const range = new vscode.Range(line, col, line, col);

  const severity =
    v.severity === "Error"
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning;

  const diag = new vscode.Diagnostic(range, v.reason, severity);
  diag.source = "swiftlint";
  diag.code = {
    value: v.rule_id,
    target: vscode.Uri.parse(
      `https://realm.github.io/SwiftLint/${v.rule_id}.html`,
    ),
  };
  return diag;
}

function explicitConfigArgs(): string[] {
  const paths = configSearchPaths();
  if (paths.length === 0) return [];
  // Only pass --config when user has explicitly set configSearchPaths.
  // Find the first path that actually exists on disk.
  const valid = paths.find((p) => fs.existsSync(p));
  if (!valid) return [];
  return ["--config", valid];
}

function buildArgs(extra: string[]): string[] {
  const args = ["lint", "--reporter", "json", "--quiet"];
  args.push(...explicitConfigArgs());
  args.push(...extra);
  args.push(...additionalParameters());
  return args;
}

export async function lintFile(
  filePath: string,
  cwd: string,
  options?: { signal?: AbortSignal },
): Promise<vscode.Diagnostic[]> {
  const args = buildArgs([filePath]);
  const execOpts: ExecOptions = { cwd, signal: options?.signal };

  const result = await execSwiftlint(args, execOpts);
  const violations = parseViolations(result.stdout);
  return violations.map(toDiagnostic);
}

export async function lintWorkspace(
  folder: string,
  options?: { signal?: AbortSignal },
): Promise<Map<string, vscode.Diagnostic[]>> {
  const args = buildArgs([]);
  const execOpts: ExecOptions = { cwd: folder, signal: options?.signal };

  const result = await execSwiftlint(args, execOpts);
  const violations = parseViolations(result.stdout);

  const byFile = new Map<string, vscode.Diagnostic[]>();
  for (const v of violations) {
    const diags = byFile.get(v.file) ?? [];
    diags.push(toDiagnostic(v));
    byFile.set(v.file, diags);
  }
  return byFile;
}

// Exported for testing
export { parseViolations, toDiagnostic };
