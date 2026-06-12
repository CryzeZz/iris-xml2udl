# iris-xml2udl

[中文说明](./README.zh-CN.md)

A VS Code extension that parses **InterSystems IRIS XML export files** and lets you browse and preview each component as **UDL (Universal Definition Language)** with full syntax highlighting — all without creating any temporary files on disk.

---

## Installation

1. Open VS Code 
2. Go to the Extensions view (`Ctrl+Shift+X`)
3. Search for **iris xml2udl**
4. Click **Install**

---

## Features

- **Right-click preview** — right-click any `.xml` file in the Explorer or Editor and select `iris xml2udl preview`
- **Tree view sidebar** — parsed components are listed in the `iris xml2udl` panel, grouped by top-level type (Class, CSP, Routine, Project, etc.)
- **Virtual documents** — clicking a tree item opens its UDL content as a virtual document (`xml2udl-udl://` scheme) — no temp files written to disk
- **Automatic syntax highlighting** — file extensions are appended to the virtual URI (`.cls`, `.csp`, `.prj`, `.udl`) so VS Code auto-detects the language mode
- **Native tab behavior** — single-click opens a preview tab (replaced by the next click); double-click or re-clicking the same item pins the tab, matching VS Code's built-in Explorer behavior
- **XML language for Project items** — Project-type content is explicitly set to XML language mode

---

## Supported Component Types

| XML Tag | File Extension | Language |
|---------|---------------|----------|
| Class | `.cls` | COS / ObjectScript |
| Routine | `.cls` | COS / ObjectScript |
| CSP (.js) | — | JavaScript |
| CSP (other) | `.csp` | HTML |
| Project | — | XML |
| Projection | `.prj` | — |
| UDLText | `.udl` | — |

---

## Usage

1. Open a folder or workspace containing IRIS XML export files (`.xml`)
2. Right-click any `.xml` file in the **Explorer** or **Editor** title bar
3. Select **`iris xml2udl preview`**
4. The **`iris xml2udl`** sidebar panel opens automatically, showing all parsed components grouped by type
5. Click any component to view its UDL content in the editor

---

## Project Structure

```
iris-xml2udl/
├── demo/                        # Browser-based prototype (standalone HTML)
│   ├── xml2Udl.html
│   └── xml2Udl.js
└── vscode-extension/            # VS Code extension
    ├── src/
    │   ├── extension.ts         # Entry point — registers commands, tree view, document provider
    │   ├── xml2UdlEngine.ts     # Core XML → UDL parsing engine (ported from demo)
    │   ├── treeDataProvider.ts  # Sidebar tree view grouped by component type
    │   └── udlDocumentProvider.ts # Virtual document provider (xml2udl-udl:// scheme)
    ├── package.json
    └── tsconfig.json
```

---

## Requirements

- VS Code **1.74.0** or later
- For COS/ObjectScript syntax highlighting: install the [InterSystems ObjectScript extension](https://marketplace.visualstudio.com/items?itemName=intersystems-community.vscode-objectscript)

---

## Building from Source

```bash
cd vscode-extension
npm install
npm run compile
```

Then press **F5** in VS Code to launch the Extension Development Host.

---

## License

[MIT](./vscode-extension/LICENSE)
