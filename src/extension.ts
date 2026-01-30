import * as path from "node:path";
import * as vscode from "vscode";
import { isEnabled, onlyEnableWithConfig } from "./config";
import { SwiftLintProvider } from "./provider";
import { SwiftLintCodeActionProvider } from "./actions";
import { fixFile, fixWorkspace, formatFile, formatWorkspace } from "./fixer";
import { killAllProcesses } from "./process";

let provider: SwiftLintProvider | undefined;
let outputChannel: vscode.OutputChannel | undefined;

const CONFIG_GLOBS = ["**/.swiftlint.yml", "**/.swiftlint.yaml"];

async function workspaceHasSwiftLintConfig(): Promise<boolean> {
  for (const pattern of CONFIG_GLOBS) {
    const files = await vscode.workspace.findFiles(pattern, null, 1);
    if (files.length > 0) return true;
  }
  return false;
}

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  if (!isEnabled()) return;

  outputChannel = vscode.window.createOutputChannel("SwiftLint");
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine("SwiftLint extension activating...");

  // Bug fix #1 (activation): if onlyEnableWithConfig is set, check for configs
  if (onlyEnableWithConfig()) {
    const hasConfig = await workspaceHasSwiftLintConfig();
    if (!hasConfig) {
      outputChannel.appendLine(
        "No .swiftlint.yml found in workspace and onlyEnableWithConfig is enabled. Skipping activation.",
      );
      return;
    }
  }

  provider = new SwiftLintProvider(outputChannel);
  context.subscriptions.push(provider);

  // Code actions
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "swift", scheme: "file" },
      new SwiftLintCodeActionProvider(),
      {
        providedCodeActionKinds:
          SwiftLintCodeActionProvider.providedCodeActionKinds,
      },
    ),
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.lintWorkspace", () => {
      provider?.lintAllWorkspaceFolders();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.fixWorkspace", async () => {
      try {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return;
        for (const folder of folders) {
          await fixWorkspace(folder.uri.fsPath);
        }
        provider?.lintAllWorkspaceFolders();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`SwiftLint Fix Workspace failed: ${msg}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.fixDocument", async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== "swift") return;
        const doc = editor.document;
        const cwd =
          vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ??
          path.dirname(doc.uri.fsPath);
        await doc.save();
        await fixFile(doc.uri.fsPath, cwd);
        provider?.lintDocument(doc);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`SwiftLint Fix Document failed: ${msg}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.formatDocument", async () => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== "swift") return;
        const doc = editor.document;
        const cwd =
          vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ??
          path.dirname(doc.uri.fsPath);
        await doc.save();
        await formatFile(doc.uri.fsPath, cwd);
        provider?.lintDocument(doc);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`SwiftLint Format Document failed: ${msg}`);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.formatWorkspace", async () => {
      try {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return;
        for (const folder of folders) {
          await formatWorkspace(folder.uri.fsPath);
        }
        provider?.lintAllWorkspaceFolders();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`SwiftLint Format Workspace failed: ${msg}`);
      }
    }),
  );

  // Activate provider — await so errors surface
  try {
    await provider.activate();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    outputChannel.appendLine(`[ERROR] Activation failed: ${msg}`);
    vscode.window.showErrorMessage(`SwiftLint: ${msg}`);
  }

  outputChannel.appendLine("SwiftLint extension activated.");
}

export function deactivate(): void {
  killAllProcesses();
}
