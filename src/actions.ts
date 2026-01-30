import * as vscode from "vscode";

export class SwiftLintCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Source.append("fixAll").append("swiftlint"),
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== "swiftlint") continue;

      const ruleId =
        typeof diag.code === "object" && diag.code !== null && "value" in diag.code
          ? String(diag.code.value)
          : String(diag.code);

      // Fix this issue
      const fixAction = new vscode.CodeAction(
        `Fix this SwiftLint issue`,
        vscode.CodeActionKind.QuickFix,
      );
      fixAction.command = {
        command: "swiftlint.fixDocument",
        title: "Fix SwiftLint issues",
      };
      fixAction.diagnostics = [diag];
      actions.push(fixAction);

      // Disable rule for next line
      const disableAction = new vscode.CodeAction(
        `Disable rule: ${ruleId}`,
        vscode.CodeActionKind.QuickFix,
      );
      disableAction.edit = new vscode.WorkspaceEdit();
      const line = diag.range.start.line;
      const lineText = document.lineAt(line);
      const indent = lineText.text.match(/^\s*/)?.[0] ?? "";
      disableAction.edit.insert(
        document.uri,
        new vscode.Position(line, 0),
        `${indent}// swiftlint:disable:next ${ruleId}\n`,
      );
      disableAction.diagnostics = [diag];
      actions.push(disableAction);
    }

    // Fix All source action
    if (context.diagnostics.some((d) => d.source === "swiftlint")) {
      const fixAll = new vscode.CodeAction(
        "Fix all SwiftLint issues",
        vscode.CodeActionKind.Source.append("fixAll").append("swiftlint"),
      );
      fixAll.command = {
        command: "swiftlint.fixDocument",
        title: "Fix all SwiftLint issues",
      };
      actions.push(fixAll);
    }

    return actions;
  }
}
