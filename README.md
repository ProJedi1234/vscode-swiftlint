# SwiftLint for VS Code

SwiftLint integration for Visual Studio Code. Lints Swift files on open, save, and (optionally) as you type.

## Requirements

- [SwiftLint](https://github.com/realm/SwiftLint) installed and available in your PATH (or configure a custom path)
- VS Code 1.105.0+

## Features

- Lint on open, save, and type (debounced)
- Workspace-wide linting
- Auto-fix via commands
- Quick fix code actions: fix issue or disable rule inline
- Clickable rule IDs in the Problems panel linking to SwiftLint docs
- Output channel logging for debugging

## Commands

| Command | Description |
|---------|-------------|
| `SwiftLint: Lint Workspace` | Lint all Swift files in the workspace |
| `SwiftLint: Fix Workspace` | Auto-fix all SwiftLint issues in the workspace |
| `SwiftLint: Fix Document` | Auto-fix SwiftLint issues in the current file |

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `swiftlint.enable` | boolean | `true` | Enable/disable the extension |
| `swiftlint.path` | string | `"swiftlint"` | Path to the swiftlint binary |
| `swiftlint.configSearchPaths` | string[] | `[]` | Additional config search paths |
| `swiftlint.additionalParameters` | string[] | `[]` | Extra CLI arguments for swiftlint |
| `swiftlint.toolchainPath` | string | `""` | Swift toolchain directory |
| `swiftlint.autoLintWorkspace` | boolean | `true` | Lint workspace on activation |
| `swiftlint.onlyEnableWithConfig` | boolean | `false` | Only enable when `.swiftlint.yml` exists |
| `swiftlint.lintOnType` | boolean | `false` | Lint as you type (500ms debounce) |
| `swiftlint.lintOnSave` | boolean | `true` | Lint when saving a file |
| `swiftlint.verboseLogging` | boolean | `false` | Verbose output channel logging |

## Development

```bash
bun install
bun run compile    # Build the extension
bun test           # Run tests
bun run watch      # Watch mode
bun run package    # Package as .vsix
```

Press F5 in VS Code to launch an Extension Development Host for testing.
