# Changelog

## 1.0.3

- Fix: components with the same name coming from different XML files no longer share one virtual document tab — the document identity now includes the source file
- Fix: re-previewing after editing an XML file refreshes the already-open UDL tab instead of showing stale content
- Chore: replace the hardcoded Node.js executable path in build scripts with a portable `tsc` invocation

## 1.0.0

- Initial release
- Parse IRIS XML export files and display components in a tree view grouped by type
- Generate UDL content for Class, Routine, CSP, Projection, UDLText, and other component types
- Preview tabs with VS Code native explorer behavior (click to preview, double-click to pin)
- File extension-based language mode detection (.cls, .csp, .prj, .udl)
