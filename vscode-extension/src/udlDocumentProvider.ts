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
 * Key: `<sourceKey>::<itemId>` — the source XML file is part of the key so that
 * identically-named components coming from different XML files never collide.
 */
const udlCache = new Map<string, UdlResult>();

/**
 * Identifies the XML file the tree currently represents (the absolute fsPath).
 * It is part of both the cache key and the virtual document URI, so two different
 * XML files containing a component with the same name open as separate documents
 * instead of sharing one (stale) tab.
 */
let currentSourceKey = '';

/**
 * Sets the source file key that subsequent cache writes and URI builds belong to.
 * Called once per parse, right after the XML file has been read successfully.
 */
export function setCurrentSource(sourceKey: string): void {
    currentSourceKey = sourceKey || '';
}

/**
 * Builds the composite cache key for an item within the current source file.
 */
function cacheKey(itemId: string): string {
    return currentSourceKey + '::' + itemId;
}

/**
 * Caches a UDL result for a given item ID.
 */
export function cacheUdlResult(itemId: string, xmlOuterHTML: string): UdlResult {
    const udl = generateUdlFromXmlElement(xmlOuterHTML);
    udlCache.set(cacheKey(itemId), udl);
    return udl;
}

/**
 * Builds a URI for a UDL virtual document.
 * Appends a file extension based on the item type (e.g., .cls for Class).
 * The query carries both the source file (`src`) and the item id (`id`) so the
 * document identity is unique per source file.
 */
export function buildUdlUri(itemId: string, itemName: string): vscode.Uri {
    // Extract tagName from itemId (format: "class-0", "property-3", "csp-1", etc.)
    const tagName = itemId.split('-')[0];
    const extension = getFileExtension(tagName, itemName);

    // Encode the item name into the path for a meaningful editor tab title
    const safeName = itemName.replace(/[<>:"/\\|?*]/g, '_');

    const query = new URLSearchParams();
    query.set('src', currentSourceKey);
    query.set('id', itemId);

    return vscode.Uri.parse(
        `${UDL_URI_SCHEME}://${UDL_URI_AUTHORITY}/${safeName}${extension}?${query.toString()}`,
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
 * Extracts the document identity (source file key + item id) from a UDL URI.
 */
function extractUriIdentity(uri: vscode.Uri): { sourceKey: string; itemId: string } {
    const params = new URLSearchParams(uri.query);
    return {
        sourceKey: params.get('src') || '',
        itemId: params.get('id') || '',
    };
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
        const { sourceKey, itemId } = extractUriIdentity(uri);
        const udl = udlCache.get(sourceKey + '::' + itemId);
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
    const udl = udlCache.get(cacheKey(itemId));
    if (!udl) {
        vscode.window.showWarningMessage(`No UDL content for "${itemName}". Please re-parse the XML.`);
        return;
    }

    const uri = buildUdlUri(itemId, itemName);

    // Check if this document is already open
    const existingDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
    if (existingDoc) {
        // The XML may have been edited and re-parsed since this tab was opened.
        // The cache already holds the fresh content (written by cacheUdlResult), so
        // fire onDidChange to make VSCode re-request it, then pin + focus the tab.
        providerInstance?.refresh(uri);
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
