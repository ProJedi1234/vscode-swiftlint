import * as vscode from "vscode";

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
