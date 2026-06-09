/**
 * IRIS XML to UDL - VSCode Extension
 *
 * Main entry point. Registers commands, tree view, and document provider.
 *
 * Flow:
 * 1. User right-clicks an .xml file → "iris xml2udl preview"
 * 2. Parse the XML, show tree in sidebar grouped by type
 * 3. Click a tree item → generate UDL → open as virtual document in editor
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseXmlFile } from './xml2UdlEngine';
import { Xml2UdlTreeDataProvider } from './treeDataProvider';
import { registerUdlDocumentProvider, cacheUdlResult, openUdlDocument } from './udlDocumentProvider';

let treeDataProvider: Xml2UdlTreeDataProvider;
let treeView: vscode.TreeView<any>;

/**
 * Extension activation.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('XML to UDL extension activated');

    // Initialize the tree data provider
    treeDataProvider = new Xml2UdlTreeDataProvider();

    // Register the tree view in the Explorer sidebar
    treeView = vscode.window.createTreeView('xml2udl.treeView', {
        treeDataProvider,
        showCollapseAll: true,
        canSelectMany: false,
    });
    context.subscriptions.push(treeView);

    // Register the virtual document provider
    const docProviderDisposable = registerUdlDocumentProvider(context);
    context.subscriptions.push(docProviderDisposable);

    // Register the main preview command (right-click menu)
    const previewCommand = vscode.commands.registerCommand('xml2udl.preview', async (uri?: vscode.Uri) => {
        await handlePreview(uri);
    });
    context.subscriptions.push(previewCommand);

    // Register the "open item" command (triggered when clicking a tree item)
    const openItemCommand = vscode.commands.registerCommand(
        'xml2udl.openItem',
        async (itemId: string, itemName: string, xmlOuterHTML?: string) => {
            await handleOpenItem(itemId, itemName, xmlOuterHTML);
        },
    );
    context.subscriptions.push(openItemCommand);

    // Register the "refresh" command for the tree view
    const refreshCommand = vscode.commands.registerCommand('xml2udl.refresh', () => {
        treeDataProvider.clear();
    });
    context.subscriptions.push(refreshCommand);
}

/**
 * Extension deactivation.
 */
export function deactivate(): void {
    console.log('XML to UDL extension deactivated');
}

/**
 * Handles the "xml2udl.preview" command.
 * Reads the selected XML file, parses it, and populates the tree view.
 */
async function handlePreview(uri?: vscode.Uri): Promise<void> {
    // Determine the file to parse
    let fileUri: vscode.Uri | undefined = uri;

    if (!fileUri) {
        // Try from active editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            fileUri = editor.document.uri;
        }
    }

    if (!fileUri) {
        vscode.window.showWarningMessage('No XML file selected.');
        return;
    }

    // Verify it's an XML file
    if (!fileUri.fsPath.toLowerCase().endsWith('.xml')) {
        vscode.window.showWarningMessage('Please select an XML file.');
        return;
    }

    try {
        // Read the XML file content
        const xmlContent = fs.readFileSync(fileUri.fsPath, 'utf-8');
        const fileName = path.basename(fileUri.fsPath);

        // Parse the XML and build tree structure
        const parsedFile = parseXmlFile(fileName, xmlContent);

        // Update the tree view
        treeDataProvider.setData([parsedFile]);

        // Focus the "iris xml2udl" sidebar view so the user sees the tree
        await vscode.commands.executeCommand('xml2udl.treeView.focus');

        // Set a message in the tree header showing summary
        const itemCount = countLeafItems(parsedFile.tree);
        const typeCount = parsedFile.tree.children ? parsedFile.tree.children.length : 0;
        treeView.message = `${itemCount} items in ${typeCount} types — click any item to view UDL`;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handles the "xml2udl.openItem" command.
 * Generates UDL from the XML element and opens it as a virtual document.
 */
async function handleOpenItem(itemId: string, itemName: string, xmlOuterHTML?: string): Promise<void> {
    if (!xmlOuterHTML) {
        vscode.window.showWarningMessage(`No XML data for "${itemName}".`);
        return;
    }

    try {
        // Generate and cache the UDL result
        cacheUdlResult(itemId, xmlOuterHTML);

        // Open as virtual document in the right-side editor
        await openUdlDocument(itemId, itemName);
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to generate UDL: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Counts the total number of leaf items in the tree.
 */
function countLeafItems(tree: { children?: Array<{ children?: Array<any> }> }): number {
    if (!tree.children || tree.children.length === 0) {
        return 0;
    }

    let count = 0;
    for (const child of tree.children) {
        if (child.children && child.children.length > 0) {
            // Type group - count its children
            count += child.children.length;
        } else {
            count++;
        }
    }
    return count;
}
