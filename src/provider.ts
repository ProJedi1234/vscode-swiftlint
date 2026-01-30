import * as path from "node:path";
import * as vscode from "vscode";
import { lintFile, lintWorkspace } from "./linter";
import {
  lintOnSave,
  lintOnType,
  autoLintWorkspace,
  onlyEnableWithConfig,
  findConfigForFile,
  verboseLogging,
} from "./config";

export class SwiftLintProvider implements vscode.Disposable {
  private readonly diagnostics: vscode.DiagnosticCollection;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly abortControllers = new Map<string, AbortController>();
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly documentVersions = new Map<string, number>();
  private version = 0;

  constructor(private readonly outputChannel: vscode.OutputChannel) {
    this.diagnostics = vscode.languages.createDiagnosticCollection("swiftlint");

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => this.onDocumentOpen(doc)),
      vscode.workspace.onDidSaveTextDocument((doc) => this.onDocumentSave(doc)),
      vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChange(e)),
      vscode.workspace.onDidDeleteFiles((e) => this.onFilesDeleted(e)),
      vscode.workspace.onDidChangeConfiguration((e) => this.onConfigChange(e)),
    );
  }

  async activate(): Promise<void> {
    // Lint already-open swift documents
    for (const doc of vscode.workspace.textDocuments) {
      if (this.isSwiftDocument(doc)) {
        await this.lintDocument(doc);
      }
    }

    // Auto-lint workspace
    if (autoLintWorkspace()) {
      await this.lintAllWorkspaceFolders();
    }
  }

  async lintDocument(doc: vscode.TextDocument): Promise<void> {
    if (!this.isSwiftDocument(doc)) return;

    // Skip if onlyEnableWithConfig is set and no config found for this file
    if (onlyEnableWithConfig() && !findConfigForFile(doc.uri.fsPath)) {
      // Clear existing diagnostics and abort controller for this file
      const uri = doc.uri.toString();
      this.diagnostics.delete(doc.uri);
      this.abortControllers.get(uri)?.abort();
      this.abortControllers.delete(uri);
      return;
    }

    const uri = doc.uri.toString();
    const ver = ++this.version;
    this.documentVersions.set(uri, ver);

    // Cancel previous lint for this file
    this.abortControllers.get(uri)?.abort();
    const controller = new AbortController();
    this.abortControllers.set(uri, controller);

    const filePath = doc.uri.fsPath;

    try {
      const cwd =
        vscode.workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath ??
        path.dirname(filePath);
      const diags = await lintFile(filePath, cwd, {
        signal: controller.signal,
        content: doc.getText(),
      });

      // Skip if a newer version has been requested
      if (this.documentVersions.get(uri) !== ver) return;

      this.diagnostics.set(doc.uri, diags);
      this.log(`Linted ${filePath}: ${diags.length} issue(s)`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      this.logError(`Error linting ${filePath}`, err);
      if (this.isSpawnError(err)) {
        vscode.window.showErrorMessage(
          `SwiftLint: Could not run swiftlint. Is it installed and on your PATH? (${(err as Error).message})`,
        );
      }
    } finally {
      if (this.abortControllers.get(uri) === controller) {
        this.abortControllers.delete(uri);
      }
    }
  }

  async lintAllWorkspaceFolders(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) return;

    for (const folder of folders) {
      try {
        const results = await lintWorkspace(folder.uri.fsPath);
        for (const [filePath, diags] of results) {
          this.diagnostics.set(vscode.Uri.file(path.resolve(folder.uri.fsPath, filePath)), diags);
        }
        this.log(`Workspace lint complete: ${results.size} file(s) with issues`);
      } catch (err) {
        this.logError(`Error linting workspace ${folder.uri.fsPath}`, err);
        if (this.isSpawnError(err)) {
          vscode.window.showErrorMessage(
            `SwiftLint: Could not run swiftlint. Is it installed and on your PATH? (${(err as Error).message})`,
          );
        }
      }
    }
  }

  private onDocumentOpen(doc: vscode.TextDocument): void {
    if (this.isSwiftDocument(doc)) {
      this.lintDocument(doc);
    }
  }

  private onDocumentSave(doc: vscode.TextDocument): void {
    // Re-lint workspace when swiftlint config changes
    const name = doc.fileName;
    if (name.endsWith(".swiftlint.yml") || name.endsWith(".swiftlint.yaml")) {
      this.lintAllWorkspaceFolders();
      return;
    }

    if (lintOnSave() && this.isSwiftDocument(doc)) {
      this.lintDocument(doc);
    }
  }

  private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    if (!lintOnType()) return;
    if (!this.isSwiftDocument(e.document)) return;

    const uri = e.document.uri.toString();

    // Clear existing debounce timer
    const existing = this.debounceTimers.get(uri);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(uri);
      this.lintDocument(e.document);
    }, 500);

    this.debounceTimers.set(uri, timer);
  }

  private onFilesDeleted(e: vscode.FileDeleteEvent): void {
    for (const uri of e.files) {
      this.diagnostics.delete(uri);
    }
  }

  private onConfigChange(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration("swiftlint")) {
      this.lintAllWorkspaceFolders();
    }
  }

  private isSwiftDocument(doc: vscode.TextDocument): boolean {
    return doc.languageId === "swift" && doc.uri.scheme !== "git";
  }

  private log(msg: string): void {
    if (verboseLogging()) {
      this.outputChannel.appendLine(`[SwiftLint] ${msg}`);
    }
  }

  private logError(msg: string, err: unknown): void {
    const detail = err instanceof Error ? err.message : String(err);
    this.outputChannel.appendLine(`[SwiftLint ERROR] ${msg}: ${detail}`);
  }

  private isSpawnError(err: unknown): boolean {
    return (
      err instanceof Error &&
      "code" in err &&
      ((err as NodeJS.ErrnoException).code === "ENOENT" ||
        (err as NodeJS.ErrnoException).code === "EACCES")
    );
  }

  dispose(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.diagnostics.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
