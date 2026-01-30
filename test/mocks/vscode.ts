// Mock vscode module for testing outside the extension host

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class Range {
  constructor(
    public startLine: number,
    public startChar: number,
    public endLine: number,
    public endChar: number,
  ) {}

  get start() {
    return { line: this.startLine, character: this.startChar };
  }
  get end() {
    return { line: this.endLine, character: this.endChar };
  }
}

export class Position {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class Diagnostic {
  source?: string;
  code?: string | number | { value: string | number; target: Uri };

  constructor(
    public range: Range,
    public message: string,
    public severity?: DiagnosticSeverity,
  ) {}
}

export class Uri {
  private constructor(
    public readonly scheme: string,
    public readonly fsPath: string,
  ) {}

  static parse(value: string): Uri {
    return new Uri("https", value);
  }

  static file(path: string): Uri {
    return new Uri("file", path);
  }

  toString(): string {
    return this.fsPath;
  }
}

export class CodeActionKind {
  private constructor(private readonly value: string) {}

  static readonly QuickFix = new CodeActionKind("quickfix");
  static readonly Source = new CodeActionKind("source");

  append(part: string): CodeActionKind {
    return new CodeActionKind(`${this.value}.${part}`);
  }
}

export class CodeAction {
  command?: { command: string; title: string };
  edit?: WorkspaceEdit;
  diagnostics?: Diagnostic[];

  constructor(
    public title: string,
    public kind: CodeActionKind,
  ) {}
}

export class WorkspaceEdit {
  private edits: Array<{ uri: Uri; position: Position; text: string }> = [];

  insert(uri: Uri, position: Position, text: string): void {
    this.edits.push({ uri, position, text });
  }

  getEdits() {
    return this.edits;
  }
}

// Configuration mock
let configValues: Record<string, unknown> = {};

export function __setConfig(values: Record<string, unknown>): void {
  configValues = values;
}

export function __resetConfig(): void {
  configValues = {};
}

export const workspace = {
  getConfiguration(section: string) {
    return {
      get<T>(key: string, defaultValue?: T): T {
        const fullKey = `${section}.${key}`;
        if (fullKey in configValues) {
          return configValues[fullKey] as T;
        }
        return defaultValue as T;
      },
    };
  },
};

export const languages = {
  createDiagnosticCollection(_name: string) {
    const store = new Map<string, Diagnostic[]>();
    return {
      set(uri: Uri, diags: Diagnostic[]) {
        store.set(uri.toString(), diags);
      },
      delete(uri: Uri) {
        store.delete(uri.toString());
      },
      dispose() {
        store.clear();
      },
      get store() {
        return store;
      },
    };
  },
};
