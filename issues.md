# Known Issues

## Bugs

- [x] `onlyEnableWithConfig` setting is a no-op — extension activates regardless of `.swiftlint.yml` presence
- [x] `configSearchPaths` blindly uses first entry without checking if the file exists
- [x] `verboseLogging` setting is ignored — output channel always logs everything
- [x] `lintDocument` fires twice on activation (activation loop + onDidOpenTextDocument event)
- [x] Workspace lint can overwrite per-file diagnostics due to URI mismatch (symlinks, case)
- [x] No error handling in format/fix commands — failures are silent
- [x] `cwd` falls back to empty string when file isn't in a workspace folder

## Limitations

- [ ] Lint-on-type lints on-disk file, not the buffer — only useful with auto-save enabled
