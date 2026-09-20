# Changelog

[中文更新日志](./CHANGELOG.zh-CN.md)

All notable changes to the **iris xml2udl** extension are documented here.

## 1.0.3 — 2026-09-20

- Fix: components with the same name coming from different XML files no longer share one virtual document tab — the document identity now includes the source file
- Fix: re-previewing after editing an XML file refreshes the already-open UDL tab instead of showing stale content
- Chore: replace the hardcoded Node.js executable path in build scripts with a portable `tsc` invocation

## 1.0.2 — 2026-06-18

- Feature: use the Routine `type` attribute as the file extension suffix (e.g. `websys.inc`, `websys.mac`)
- Docs: add a Chinese README for the extension, cross-linked with the English one
- Docs: add installation instructions to all README files
- Demo: Chinese/English UI with a `?lang=zh|en` URL parameter (English by default)
- Demo: bundle jQuery EasyUI 1.7.0 locally and load jQuery over HTTPS (fixes mixed-content warnings)
- Demo: deploy to GitHub Pages with a landing page and an automated deploy workflow

## 1.0.1 — 2026-06-12

- Docs: add English and Chinese README with cross-links
- Docs: correct the tree view description — class members are sub-items, not top-level types
- Chore: fix the repository URL in `package.json`
- Demo: point page resources at the online address

## 1.0.0 — 2026-06-09

- Initial release
- Parse IRIS XML export files and display components in a tree view grouped by type
- Generate UDL content for Class, Routine, CSP, Projection, UDLText, and other component types
- Preview tabs with VS Code native explorer behavior (click to preview, double-click to pin)
- File extension-based language mode detection (.cls, .csp, .prj, .udl)
