import * as vscode from "vscode";
import { isEnabled } from "./config";
import { SwiftLintProvider } from "./provider";
import { SwiftLintCodeActionProvider } from "./actions";
import { fixFile, fixWorkspace } from "./fixer";
import { killAllProcesses } from "./process";

let provider: SwiftLintProvider | undefined;
let outputChannel: vscode.OutputChannel | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  if (!isEnabled()) return;

  outputChannel = vscode.window.createOutputChannel("SwiftLint");
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine("SwiftLint extension activating...");

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
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) return;
      for (const folder of folders) {
        await fixWorkspace(folder.uri.fsPath);
      }
      provider?.lintAllWorkspaceFolders();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("swiftlint.fixDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "swift") return;
      const doc = editor.document;
      const cwd =
        vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ?? "";
      await doc.save();
      await fixFile(doc.uri.fsPath, cwd);
      provider?.lintDocument(doc);
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
