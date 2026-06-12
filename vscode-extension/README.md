# iris xml2udl

Parse InterSystems IRIS XML export files and preview individual components as UDL (Universal Definition Language) with syntax highlighting right inside VS Code.

## Features

- **Right-click any `.xml` file** and select `iris xml2udl preview` to parse
- Browse parsed components in a tree view grouped by top-level type (Class, CSP, Routine, Project, etc.)
- Click any item to open its UDL content in the editor with proper file extensions (`.cls`, `.csp`, `.prj`, `.udl`)
- VS Code auto-detects language mode from the file extension for syntax highlighting
- Preview tab behavior matches VS Code's native explorer (click to preview, double-click to pin)

## Usage

1. Right-click an IRIS XML export file in the Explorer or Editor
2. Select **iris xml2udl preview**
3. The `iris xml2udl` sidebar panel opens with all parsed components grouped by top-level type
4. Click any component to view its UDL content in the editor

## Requirements

- VS Code 1.74.0 or later

## Extension Settings

This extension contributes the following views and commands:

- `iris xml2udl` view in the Explorer sidebar
- `iris xml2udl preview` command (available in editor and explorer context menus for `.xml` files)
