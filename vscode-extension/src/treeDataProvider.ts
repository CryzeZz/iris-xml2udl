/**
 * Tree Data Provider for the XML to UDL sidebar view.
 * Shows parsed XML items grouped by type (Class, Property, Method, etc.).
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ParsedFile, TreeItemData } from './xml2UdlEngine';

/**
 * Custom TreeItem that carries the parsed file data.
 */
export class Xml2UdlTreeItem extends vscode.TreeItem {
    /** The original tree data from the parsing engine */
    data: TreeItemData;
    /** Parent parsed file reference (for root nodes it's self, for children it's the owning file) */
    file: ParsedFile;

    constructor(
        data: TreeItemData,
        file: ParsedFile,
        collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(data.text, collapsibleState);
        this.data = data;
        this.file = file;

        // Set icons and tooltips based on node type
        this.setupAppearance();
    }

    private setupAppearance(): void {
        const hasChildren = this.data.children && this.data.children.length > 0;

        if (!hasChildren) {
            // Leaf node - a specific XML item
            this.iconPath = new vscode.ThemeIcon('symbol-value');
            this.tooltip = `Click to view UDL for: ${this.data.text}`;
            this.command = {
                command: 'xml2udl.openItem',
                title: 'Open UDL',
                arguments: [this.data.id, this.data.text, this.data.xmlOuterHTML],
            };
            this.contextValue = 'xml2udl-item';
        } else {
            // Check if this is the root file node or a type group
            const isRoot = this.data.id.startsWith('file');
            if (isRoot) {
                this.iconPath = new vscode.ThemeIcon('file-code');
                this.tooltip = `XML file: ${this.data.text}`;
                this.contextValue = 'xml2udl-file';
            } else {
                // Type group node (e.g., "Class", "Property", etc.)
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                this.tooltip = `Type: ${this.data.text} (${this.data.children!.length} items)`;
                this.contextValue = 'xml2udl-typegroup';
                // Show count in description
                this.description = `${this.data.children!.length} items`;
            }
        }
    }
}

/**
 * TreeDataProvider implementation for the XML to UDL view.
 */
export class Xml2UdlTreeDataProvider implements vscode.TreeDataProvider<Xml2UdlTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Xml2UdlTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _files: ParsedFile[] = [];

    /**
     * Sets the parsed file data and refreshes the tree.
     */
    setData(files: ParsedFile[]): void {
        this._files = files;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the current files.
     */
    getFiles(): ParsedFile[] {
        return this._files;
    }

    /**
     * Clears the tree.
     */
    clear(): void {
        this._files = [];
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Xml2UdlTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Xml2UdlTreeItem): vscode.ProviderResult<Xml2UdlTreeItem[]> {
        if (!element) {
            // Root level - show file nodes
            if (this._files.length === 0) {
                const emptyItem = new vscode.TreeItem(
                    'Right-click an .xml file and select "xml2udl预览" to parse',
                    vscode.TreeItemCollapsibleState.None,
                );
                emptyItem.iconPath = new vscode.ThemeIcon('info');
                return [emptyItem as any];
            }

            return this._files.map(file => {
                return new Xml2UdlTreeItem(
                    file.tree,
                    file,
                    file.tree.children && file.tree.children.length > 0
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.None,
                );
            });
        }

        // Child level - show type group or leaf items
        if (element.data.children && element.data.children.length > 0) {
            return element.data.children.map(child => {
                const hasChildren = child.children && child.children.length > 0;
                return new Xml2UdlTreeItem(
                    child,
                    element.file,
                    hasChildren
                        ? vscode.TreeItemCollapsibleState.Expanded
                        : vscode.TreeItemCollapsibleState.None,
                );
            });
        }

        return [];
    }

    getParent(element: Xml2UdlTreeItem): vscode.ProviderResult<Xml2UdlTreeItem> {
        // Could be implemented if needed for navigation
        return null;
    }
}
