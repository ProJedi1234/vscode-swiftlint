import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";

function cfg(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("swiftlint");
}

export function isEnabled(): boolean {
  return cfg().get<boolean>("enable", true);
}

export function swiftlintPath(): string {
  return cfg().get<string>("path", "swiftlint");
}

export function configSearchPaths(): string[] {
  return cfg().get<string[]>("configSearchPaths", []);
}

export function additionalParameters(): string[] {
  return cfg().get<string[]>("additionalParameters", []);
}

export function toolchainPath(): string | undefined {
  const p = cfg().get<string>("toolchainPath", "");
  return p || undefined;
}

export function autoLintWorkspace(): boolean {
  return cfg().get<boolean>("autoLintWorkspace", true);
}

export function onlyEnableWithConfig(): boolean {
  return cfg().get<boolean>("onlyEnableWithConfig", false);
}

export function lintOnType(): boolean {
  return cfg().get<boolean>("lintOnType", false);
}

export function lintOnSave(): boolean {
  return cfg().get<boolean>("lintOnSave", true);
}

export function verboseLogging(): boolean {
  return cfg().get<boolean>("verboseLogging", false);
}

export function explicitConfigArgs(): string[] {
  const paths = configSearchPaths();
  if (paths.length === 0) return [];
  const valid = paths.find((p) => fs.existsSync(p));
  if (!valid) return [];
  return ["--config", valid];
}

const CONFIG_NAMES = [".swiftlint.yml", ".swiftlint.yaml"];

/**
 * Walk up from a file's directory to find the nearest SwiftLint config.
 * Used only for gating (e.g. onlyEnableWithConfig), NOT for passing to --config.
 */
export function findConfigForFile(filePath: string): string | undefined {
  let dir = path.dirname(filePath);
  const root = path.parse(dir).root;
  while (true) {
    for (const name of CONFIG_NAMES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    if (dir === root) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}
