/**
 * Virtual Document Provider for UDL content.
 * Uses the `xml2udl-udl:` URI scheme to serve generated UDL text as virtual documents.
 * This enables VSCode's native syntax highlighting and other editor features.
 */

import * as vscode from 'vscode';
import { generateUdlFromXmlElement, UdlResult } from './xml2UdlEngine';

/**
 * URI scheme for UDL virtual documents.
 * Format: xml2udl-udl://authority/itemId
 */
export const UDL_URI_SCHEME = 'xml2udl-udl';
export const UDL_URI_AUTHORITY = 'preview';

/**
 * Stores generated UDL results so they can be served to the editor.
 * Key: itemId (matches the tree item ID from TreeDataProvider)
 */
const udlCache = new Map<string, UdlResult>();

/**
 * Caches a UDL result for a given item ID.
 */
export function cacheUdlResult(itemId: string, xmlOuterHTML: string): UdlResult {
    const udl = generateUdlFromXmlElement(xmlOuterHTML);
    udlCache.set(itemId, udl);
    return udl;
}

/**
 * Builds a URI for a UDL virtual document.
 * Appends a file extension based on the item type (e.g., .cls for Class).
 */
export function buildUdlUri(itemId: string, itemName: string): vscode.Uri {
    // Extract tagName from itemId (format: "class-0", "property-3", "csp-1", etc.)
    const tagName = itemId.split('-')[0];
    const extension = getFileExtension(tagName, itemName);

    // Encode the item name into the path for a meaningful editor tab title
    const safeName = itemName.replace(/[<>:"/\\|?*]/g, '_');
    return vscode.Uri.parse(
        `${UDL_URI_SCHEME}://${UDL_URI_AUTHORITY}/${safeName}${extension}?id=${encodeURIComponent(itemId)}`,
    );
}

/**
 * Returns the appropriate file extension for a given XML tag type.
 */
function getFileExtension(tagName: string, itemName: string): string {
    switch (tagName) {
        case 'class':
            return '.cls';
        case 'routine':
            // Routine name already includes type extension (e.g., websys.inc)
            return '';
        case 'csp':
            // If the CSP name already ends with .js, don't add another extension
            if (itemName.endsWith('.js')) {
                return '';
            }
            return '.csp';
        case 'projection':
            return '.prj';
        case 'udltext':
            return '.udl';
        default:
            return '';
    }
}

/**
 * Extracts the item ID from a UDL URI.
 */
function extractItemId(uri: vscode.Uri): string {
    const params = new URLSearchParams(uri.query);
    return decodeURIComponent(params.get('id') || '');
}

/**
 * TextDocumentContentProvider that serves generated UDL content.
 */
class UdlDocumentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    provideTextDocumentContent(uri: vscode.Uri): string {
        const itemId = extractItemId(uri);
        const udl = udlCache.get(itemId);
        if (udl) {
            return udl.text;
        }
        return '// UDL content not found. Please re-select the item from the XML to UDL tree view.';
    }

    /**
     * Notifies that a document has changed (used to refresh the editor content).
     */
    refresh(uri: vscode.Uri): void {
        this._onDidChange.fire(uri);
    }
}

let providerInstance: UdlDocumentProvider | null = null;

/**
 * Registers the UDL document provider with VSCode.
 * Must be called in the extension's activate() function.
 */
export function registerUdlDocumentProvider(context: vscode.ExtensionContext): vscode.Disposable {
    providerInstance = new UdlDocumentProvider();
    return vscode.workspace.registerTextDocumentContentProvider(UDL_URI_SCHEME, providerInstance);
}

/**
 * Opens a UDL virtual document in the editor.
 * Language mode is auto-detected by VSCode from the file extension in the URI.
 * Tab behavior mimics VSCode's native explorer:
 *   - Single click → preview tab (replaced by next click)
 *   - Double click (or re-click same item) → pinned tab (next click opens a new one)
 */
export async function openUdlDocument(itemId: string, itemName: string): Promise<void> {
    const udl = udlCache.get(itemId);
    if (!udl) {
        vscode.window.showWarningMessage(`No UDL content for "${itemName}". Please re-parse the XML.`);
        return;
    }

    const uri = buildUdlUri(itemId, itemName);

    // Check if this document is already open
    const existingDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (existingDoc) {
        // Re-clicking the same item → pin the tab (preview: false)
        await vscode.window.showTextDocument(existingDoc, {
            viewColumn: vscode.ViewColumn.Active,
            preview: false,
            preserveFocus: false,
        });
        return;
    }

    // Open as a preview tab — will be replaced by the next tree item click
    const doc = await vscode.workspace.openTextDocument(uri);

    // Project items produce XML content but have no file extension in the URI,
    // so VSCode can't auto-detect the language — set it explicitly to XML.
    if (udl.language === 'xml') {
        await vscode.languages.setTextDocumentLanguage(doc, 'xml');
    }

    await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.Active,
        preview: true,
        preserveFocus: false,
    });
}
