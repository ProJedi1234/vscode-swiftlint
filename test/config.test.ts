import { describe, it, expect, beforeEach, mock } from "bun:test";

const vscodeMock = await import("./mocks/vscode");
mock.module("vscode", () => vscodeMock);

const config = await import("../src/config");

describe("config", () => {
  beforeEach(() => {
    vscodeMock.__resetConfig();
  });

  describe("isEnabled", () => {
    it("returns true by default", () => {
      expect(config.isEnabled()).toBe(true);
    });

    it("returns false when disabled", () => {
      vscodeMock.__setConfig({ "swiftlint.enable": false });
      expect(config.isEnabled()).toBe(false);
    });
  });

  describe("swiftlintPath", () => {
    it("returns 'swiftlint' by default", () => {
      expect(config.swiftlintPath()).toBe("swiftlint");
    });

    it("returns custom path when set", () => {
      vscodeMock.__setConfig({ "swiftlint.path": "/usr/local/bin/swiftlint" });
      expect(config.swiftlintPath()).toBe("/usr/local/bin/swiftlint");
    });
  });

  describe("configSearchPaths", () => {
    it("returns empty array by default", () => {
      expect(config.configSearchPaths()).toEqual([]);
    });

    it("returns custom paths when set", () => {
      vscodeMock.__setConfig({ "swiftlint.configSearchPaths": ["/a", "/b"] });
      expect(config.configSearchPaths()).toEqual(["/a", "/b"]);
    });
  });

  describe("additionalParameters", () => {
    it("returns empty array by default", () => {
      expect(config.additionalParameters()).toEqual([]);
    });
  });

  describe("toolchainPath", () => {
    it("returns undefined by default", () => {
      expect(config.toolchainPath()).toBeUndefined();
    });

    it("returns path when set", () => {
      vscodeMock.__setConfig({ "swiftlint.toolchainPath": "/Library/Toolchains/swift.xctoolchain" });
      expect(config.toolchainPath()).toBe("/Library/Toolchains/swift.xctoolchain");
    });

    it("returns undefined for empty string", () => {
      vscodeMock.__setConfig({ "swiftlint.toolchainPath": "" });
      expect(config.toolchainPath()).toBeUndefined();
    });
  });

  describe("autoLintWorkspace", () => {
    it("returns true by default", () => {
      expect(config.autoLintWorkspace()).toBe(true);
    });
  });

  describe("onlyEnableWithConfig", () => {
    it("returns false by default", () => {
      expect(config.onlyEnableWithConfig()).toBe(false);
    });
  });

  describe("lintOnType", () => {
    it("returns false by default", () => {
      expect(config.lintOnType()).toBe(false);
    });

    it("returns true when enabled", () => {
      vscodeMock.__setConfig({ "swiftlint.lintOnType": true });
      expect(config.lintOnType()).toBe(true);
    });
  });

  describe("lintOnSave", () => {
    it("returns true by default", () => {
      expect(config.lintOnSave()).toBe(true);
    });
  });

  describe("verboseLogging", () => {
    it("returns false by default", () => {
      expect(config.verboseLogging()).toBe(false);
    });
  });
});
