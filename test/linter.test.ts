import { describe, it, expect, mock } from "bun:test";

// Must mock vscode before importing linter
mock.module("vscode", () => import("./mocks/vscode"));

const { parseViolations, toDiagnostic } = await import("../src/linter");
const vscode = await import("./mocks/vscode");

describe("parseViolations", () => {
  it("parses empty string to empty array", () => {
    expect(parseViolations("")).toEqual([]);
  });

  it("parses whitespace-only string to empty array", () => {
    expect(parseViolations("   \n  ")).toEqual([]);
  });

  it("parses valid JSON array of violations", () => {
    const json = JSON.stringify([
      {
        character: 5,
        file: "/path/to/file.swift",
        line: 10,
        reason: "Line should not have trailing whitespace",
        rule_id: "trailing_whitespace",
        severity: "Warning",
        type: "Trailing Whitespace",
      },
    ]);
    const result = parseViolations(json);
    expect(result).toHaveLength(1);
    expect(result[0].rule_id).toBe("trailing_whitespace");
    expect(result[0].severity).toBe("Warning");
    expect(result[0].line).toBe(10);
    expect(result[0].character).toBe(5);
  });

  it("parses multiple violations", () => {
    const json = JSON.stringify([
      {
        character: null,
        file: "/a.swift",
        line: 1,
        reason: "Reason A",
        rule_id: "rule_a",
        severity: "Error",
        type: "Type A",
      },
      {
        character: 3,
        file: "/b.swift",
        line: 20,
        reason: "Reason B",
        rule_id: "rule_b",
        severity: "Warning",
        type: "Type B",
      },
    ]);
    const result = parseViolations(json);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseViolations("not json")).toEqual([]);
  });
});

describe("toDiagnostic", () => {
  it("maps Warning severity correctly", () => {
    const violation = {
      character: 5,
      file: "/path.swift",
      line: 10,
      reason: "Some warning",
      rule_id: "some_rule",
      severity: "Warning" as const,
      type: "Some Type",
    };
    const diag = toDiagnostic(violation);

    expect(diag.severity).toBe(vscode.DiagnosticSeverity.Warning);
    expect(diag.message).toBe("Some warning");
    expect(diag.source).toBe("swiftlint");
    expect(diag.range.start.line).toBe(9); // 0-indexed
    expect(diag.range.start.character).toBe(4); // 0-indexed
  });

  it("maps Error severity correctly", () => {
    const violation = {
      character: 1,
      file: "/path.swift",
      line: 1,
      reason: "Some error",
      rule_id: "error_rule",
      severity: "Error" as const,
      type: "Error Type",
    };
    const diag = toDiagnostic(violation);
    expect(diag.severity).toBe(vscode.DiagnosticSeverity.Error);
  });

  it("handles null character (defaults to column 0)", () => {
    const violation = {
      character: null,
      file: "/path.swift",
      line: 5,
      reason: "No column",
      rule_id: "rule",
      severity: "Warning" as const,
      type: "Type",
    };
    const diag = toDiagnostic(violation);
    expect(diag.range.start.character).toBe(0);
  });

  it("sets code with rule_id and clickable link", () => {
    const violation = {
      character: 1,
      file: "/path.swift",
      line: 1,
      reason: "Reason",
      rule_id: "trailing_whitespace",
      severity: "Warning" as const,
      type: "Type",
    };
    const diag = toDiagnostic(violation);
    expect(diag.code).toBeDefined();
    const code = diag.code as { value: string; target: { fsPath: string } };
    expect(code.value).toBe("trailing_whitespace");
  });

  it("handles line 0 gracefully (clamps to 0)", () => {
    const violation = {
      character: 1,
      file: "/path.swift",
      line: 0,
      reason: "Edge case",
      rule_id: "rule",
      severity: "Warning" as const,
      type: "Type",
    };
    const diag = toDiagnostic(violation);
    expect(diag.range.start.line).toBe(0);
  });
});
