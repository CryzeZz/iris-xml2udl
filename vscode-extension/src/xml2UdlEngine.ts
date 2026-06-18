/**
 * XML to UDL (Universal Definition Language) parsing engine.
 * Ported from demo/xml2Udl.js for VSCode extension use.
 */

import { DOMParser } from '@xmldom/xmldom';

// ========== Type Definitions ==========

export interface MetaFieldDef {
    type?: 'string' | 'boolean' | 'block' | 'integer';
    on?: string;
    off?: string;
    multiple?: boolean;
    nullValues?: string[];
    quotePatten?: RegExp;
}

export type MetaDef = Record<string, Record<string, MetaFieldDef>>;

export interface UdlResult {
    title: string;
    text: string;
    language?: string;
}

export interface TreeItemData {
    id: string;
    text: string;
    tagName: string;
    attributes?: Record<string, string>;
    children?: TreeItemData[];
    /** Original XML element for later UDL generation */
    xmlOuterHTML?: string;
    udl?: UdlResult;
}

export interface ParsedFile {
    fileName: string;
    tree: TreeItemData;
    /** Map from tree item id to xml outerHTML for lazy UDL generation */
    xmlMap: Record<string, string>;
}

// ========== Constants ==========

const LINE_FEED = '\n';

// ========== Meta Definitions ==========

const _META: MetaDef = {
    Class: {
        Name: {},
        Abstract: { type: 'boolean', on: 'Abstract', off: 'Not Abstract' },
        ClassType: { type: 'string' },
        ClientDataType: { type: 'string' },
        ClientName: { type: 'string' },
        CompileAfter: { type: 'string', multiple: true },
        ConstraintClass: { type: 'string', multiple: true },
        Copyright: {},
        DdlAllowed: { type: 'boolean', on: 'DdlAllowed', off: 'Not DdlAllowed' },
        DependsOn: { type: 'string', multiple: true },
        Deprecated: { type: 'boolean', on: 'Deprecated', off: 'Not Deprecated' },
        Description: {},
        EmbeddedClass: { type: 'string', multiple: true },
        Final: { type: 'boolean', on: 'Final', off: 'Not Final' },
        GeneratedBy: { type: 'string' },
        Hidden: { type: 'boolean', on: 'Hidden', off: 'Not Hidden' },
        Import: {},
        IncludeCode: {},
        IncludeGenerator: {},
        IndexClass: { type: 'string', multiple: true },
        Inheritance: { type: 'string' },
        language: { type: 'string' },
        LegacyInstanceContext: { type: 'boolean', on: 'LegacyInstanceContext', off: 'Not LegacyInstanceContext' },
        MemberSuper: { type: 'string', multiple: true },
        NoContext: { type: 'boolean', on: 'NoContext', off: 'Not NoContext' },
        NoExtent: { type: 'boolean', on: 'NoExtent', off: 'Not NoExtent' },
        OdbcType: { type: 'string' },
        Owner: { type: 'block' },
        ProcedureBlock: { type: 'boolean', on: 'ProcedureBlock', off: 'Not ProcedureBlock' },
        ProjectionClass: { type: 'string', multiple: true },
        PropertyClass: { type: 'string', multiple: true },
        QueryClass: { type: 'string', multiple: true },
        ServerOnly: { type: 'string' },
        Sharded: { type: 'string' },
        SoapBindingStyle: { type: 'string' },
        SoapBodyUse: { type: 'string' },
        SqlCategory: { type: 'string' },
        SqlRowIdName: { type: 'string' },
        SqlRowIdPrivate: { type: 'boolean', on: 'SqlRowIdPrivate', off: 'Not SqlRowIdPrivate' },
        SqlTableName: { type: 'string' },
        StorageStrategy: { type: 'string' },
        System: { type: 'string' },
        TriggerClass: { type: 'string', multiple: true },
        ViewQuery: { type: 'block' },
    },
    Parameter: {
        Name: {},
        Abstract: { type: 'boolean', on: 'Abstract', off: '' },
        Constraint: { type: 'string' },
        Default: {},
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Encoded: { type: 'boolean', on: 'Encoded', off: '' },
        Expression: {},
        Final: { type: 'boolean', on: 'Final', off: '' },
        Flags: { type: 'string' },
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        Type: {},
    },
    Property: {
        Name: {},
        Aliases: { type: 'block' },
        Calculated: { type: 'boolean', on: 'Calculated', off: '' },
        Cardinality: { type: 'string' },
        ClientName: { type: 'string' },
        Collection: {},
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Final: { type: 'boolean', on: 'Final', off: '' },
        Identity: { type: 'boolean', on: 'Identity', off: '' },
        InitialExpression: { type: 'string' },
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        Inverse: { type: 'string' },
        MultiDimensional: { type: 'boolean', on: 'MultiDimensional', off: '' },
        NoModBit: { type: 'boolean', on: 'NoModBit', off: '' },
        NotInheritable: { type: 'boolean', on: 'NotInheritable', off: '' },
        OnDelete: { type: 'string' },
        Parameters: {},
        Private: { type: 'boolean', on: 'Private', off: '' },
        ReadOnly: { type: 'boolean', on: 'ReadOnly', off: '' },
        Relationship: {},
        Required: { type: 'boolean', on: 'Required', off: '' },
        SequenceNumber: {},
        ServerOnly: { type: 'string' },
        SqlCollation: { type: 'string' },
        SqlColumnNumber: { type: 'string' },
        SqlComputeCode: { type: 'block' },
        SqlComputed: { type: 'boolean', on: 'SqlComputed', off: '' },
        SqlComputeOnChange: { type: 'string', multiple: true },
        SqlFieldName: { type: 'string' },
        SqlListDelimiter: { type: 'string' },
        SqlListType: { type: 'string' },
        Transient: { type: 'boolean', on: 'Transient', off: '' },
        Type: {},
    },
    Index: {
        Name: {},
        Abstract: { type: 'boolean', on: 'Abstract', off: '' },
        Condition: { type: 'block' },
        CoshardWith: { type: 'string' },
        Data: { type: 'string', multiple: true },
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Extent: { type: 'boolean', on: 'Extent', off: '' },
        IdKey: { type: 'boolean', on: 'IdKey', off: '' },
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        Parameters: {},
        PrimaryKey: { type: 'boolean', on: 'PrimaryKey', off: '' },
        Properties: {},
        SequenceNumber: {},
        ShardKey: { type: 'boolean', on: 'ShardKey', off: '' },
        SqlName: { type: 'string' },
        Type: { type: 'string' },
        TypeClass: {},
        Unique: { type: 'boolean', on: 'Unique', off: '' },
    },
    Method: {
        Name: {},
        Abstract: { type: 'boolean', on: 'Abstract', off: '' },
        ClassMethod: {},
        ClientMethod: {},
        ClientName: { type: 'string' },
        CodeMode: { type: 'string' },
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        ExternalProcName: { type: 'string' },
        Final: { type: 'boolean', on: 'Final', off: '' },
        ForceGenerate: { type: 'boolean', on: 'ForceGenerate', off: '' },
        FormalSpec: {},
        GenerateAfter: { type: 'string', multiple: true },
        Hash: {},
        Implementation: {},
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        Language: { type: 'string' },
        NoContext: { type: 'boolean', on: 'NoContext', off: '' },
        NotForProperty: { type: 'boolean', on: 'NotForProperty', off: '' },
        NotInheritable: { type: 'boolean', on: 'NotInheritable', off: '' },
        PlaceAfter: { type: 'string', multiple: true },
        Private: { type: 'boolean', on: 'Private', off: '' },
        ProcedureBlock: { type: 'string' },
        PublicList: { type: 'string', multiple: true },
        Requires: { type: 'string' },
        ReturnResultsets: { type: 'boolean', on: 'ReturnResultsets', off: '' },
        ReturnType: {},
        ReturnTypeParams: {},
        SequenceNumber: {},
        ServerOnly: { type: 'string' },
        SoapAction: { type: 'string' },
        SoapBindingStyle: { type: 'string' },
        SoapBodyUse: { type: 'string' },
        SoapMessageName: { type: 'string' },
        SoapNameSpace: { type: 'string' },
        SoapRequestMessage: { type: 'string' },
        SoapTypeNameSpace: { type: 'string' },
        SqlName: { type: 'string' },
        SqlProc: { type: 'boolean', on: 'SqlProc', off: '' },
        SqlRoutine: { type: 'string' },
        WebMethod: { type: 'boolean', on: 'WebMethod', off: '' },
        ZenMethod: { type: 'boolean', on: 'ZenMethod', off: '' },
    },
    Query: {
        Name: {},
        ClientName: { type: 'string' },
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        ExternalProcName: { type: 'string' },
        Final: { type: 'boolean', on: 'Final', off: '' },
        FormalSpec: {},
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        NotInheritable: { type: 'boolean', on: 'NotInheritable', off: '' },
        Parameters: {},
        Private: { type: 'boolean', on: 'Private', off: '' },
        SequenceNumber: {},
        ServerOnly: { type: 'string' },
        SoapBindingStyle: { type: 'string' },
        SoapBodyUse: { type: 'string' },
        SoapNameSpace: { type: 'string' },
        SqlName: { type: 'string' },
        SqlProc: { type: 'boolean', on: 'SqlProc', off: '' },
        SqlQuery: {},
        SqlView: { type: 'boolean', on: 'SqlView', off: '' },
        SqlViewName: { type: 'string' },
        Type: {},
        WebMethod: { type: 'boolean', on: 'WebMethod', off: '' },
    },
    Trigger: {
        Name: {},
        Code: {},
        CodeMode: { type: 'string' },
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Event: { type: 'string' },
        Final: { type: 'boolean', on: 'Final', off: '' },
        Foreach: { type: 'string' },
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        Language: { type: 'string' },
        NewTable: { type: 'string' },
        OldTable: { type: 'string' },
        Order: { type: 'string' },
        SequenceNumber: {},
        SqlName: { type: 'string' },
        Time: { type: 'string', nullValues: ['BEFORE'] },
        UpdateColumnList: { type: 'string', multiple: true },
    },
    Storage: {
        Name: {},
    },
    ForeignKey: {
        Name: {},
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        NoCheck: { type: 'boolean', on: 'NoCheck', off: '' },
        OnDelete: { type: 'string', nullValues: ['noaction'] },
        OnUpdate: { type: 'string', nullValues: ['noaction'] },
        Properties: {},
        ReferencedClass: {},
        ReferencedKey: {},
        SequenceNumber: {},
        SqlName: { type: 'string' },
    },
    XData: {
        Name: {},
        Data: {},
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        MimeType: { type: 'string', nullValues: ['text/xml'] },
        SchemaSpec: { type: 'string' },
        SequenceNumber: { type: 'integer' },
        XMLNamespace: { type: 'string', quotePatten: /[:=,"]/ },
    },
    UDLText: {
        Name: {},
    },
    Projection: {
        Name: {},
        Deprecated: { type: 'boolean', on: 'Deprecated', off: '' },
        Description: {},
        Internal: { type: 'boolean', on: 'Internal', off: '' },
        NotInheritable: { type: 'boolean', on: 'NotInheritable', off: '' },
        Parameters: {},
        SequenceNumber: {},
        Type: {},
    },
};

// ========== Helper Functions ==========

function multipleString2Text(str: string): string {
    if (str.indexOf(',') > -1) {
        return '(' + str.split(',').join(', ') + ')';
    } else {
        return str;
    }
}

function block2Text(str: string): string {
    return '{' + str + '}';
}

function boolean2Text(str: string, o: MetaFieldDef): string {
    return str === '1' ? (o.on || '') : (o.off || '');
}

function isValidNumber(str: string): boolean {
    return /^(-?[1-9]\d*(\.\d+)?|0(\.0+)?|\.\d+)$/.test(str);
}

function paramValue2Text(str: string | null): string {
    if (str === null) {
        return '""';
    } else if (isValidNumber(str)) {
        return str;
    } else {
        return '"' + str + '"';
    }
}

interface OoDefMap {
    [key: string]: string;
}

function getOoDefPropertyText(def: OoDefMap, type: string): string {
    const meta = _META[type];
    if (!meta) {
        return '';
    }
    const textArr: string[] = [];
    for (const key in meta) {
        const o = meta[key];
        if (o.type && def[key] !== undefined) {
            const value = def[key];
            let text = '';
            if (o.type === 'string') {
                if (o.nullValues && o.nullValues.indexOf(value) > -1) {
                    text = '';
                } else if (o.multiple) {
                    text = key + ' = ' + multipleString2Text(value);
                } else if (o.quotePatten) {
                    if (o.quotePatten.test(value)) {
                        text = key + ' = ' + '"' + value.replace(/"/g, '""') + '"';
                    } else {
                        text = key + ' = ' + value;
                    }
                } else {
                    text = key + ' = ' + value;
                }
            } else if (o.type === 'boolean') {
                text = boolean2Text(value, o);
            } else if (o.type === 'block') {
                text = key + ' = ' + block2Text(value);
            }
            if (text) {
                textArr.push(text);
            }
        }
    }

    if (textArr.length > 0) {
        return ' [ ' + textArr.join(', ') + ' ]';
    } else {
        return '';
    }
}

// ========== XML Parsing Helpers ==========

/**
 * Gets all child elements of an XML node.
 * xmldom's childNodes includes text nodes, we filter to only elements.
 */
function getChildElements(node: Element): Element[] {
    const result: Element[] = [];
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === 1) { // ELEMENT_NODE
            result.push(child as Element);
        }
    }
    return result;
}

function getElementByTagName(node: Element, tagName: string): Element | null {
    const children = getChildElements(node);
    for (const item of children) {
        if (item.tagName.toLowerCase() === tagName.toLowerCase()) {
            return item;
        }
    }
    return null;
}

function getAttribute(node: Element, name: string): string | null {
    const attr = node.getAttribute(name);
    return attr;
}

interface CommResult {
    ooDef: OoDefMap;
    paramArr: string[];
}

function parseComm(node: Element): CommResult {
    const ooDef: OoDefMap = {};
    const paramArr: string[] = [];
    const children = getChildElements(node);

    for (const item of children) {
        const tagName = item.tagName;
        if (tagName === 'Description') {
            ooDef[tagName] = description2Udl(item).text;
        } else if (tagName === 'Parameter') {
            const paramName = getAttribute(item, 'name') || '';
            const paramValue = getAttribute(item, 'value') || '';
            paramArr.push(paramName + ' = ' + paramValue2Text(paramValue));
        } else {
            ooDef[tagName] = item.textContent || '';
        }
    }
    return { ooDef, paramArr };
}

function description2Udl(node: Element): { title: string; text: string } {
    let desc = node.textContent || '';
    if (desc.startsWith(LINE_FEED)) { desc = desc.slice(1); }
    const text = desc.split(LINE_FEED).join(LINE_FEED + '/// ');
    return {
        title: node.tagName,
        text: '/// ' + text,
    };
}

// ========== FormalSpec Parser ==========

interface FormalSpecItem {
    name: string;
    type: string;
    default: string;
    byRef: boolean;
    output: boolean;
}

function parseFormalSpec(str: string): FormalSpecItem[] {
    const len = str.length;
    const arr: FormalSpecItem[] = [];

    let state = 0, token = '', isByRef = false, isOutput = false;
    let argName = '', argType = '', argDefault = '';

    for (let i = 0; i < len; i++) {
        const ch = str.charAt(i);

        if (state === 0) { // Initial state
            if (ch === '&') {
                isByRef = true;
                state = 1;
            } else if (ch === '*') {
                isOutput = true;
            } else if (ch === ' ') {
                // skip whitespace
            } else {
                state = 1;
                token += ch;
            }
        } else if (state === 1) { // Finding arg name
            if (ch === ':') {
                state = 2;
                argName = token;
                token = '';
            } else if (ch === '=') {
                state = 3;
                argName = token;
                token = '';
            } else if (ch === ',') {
                state = 0;
                argName = token;
                token = '';
                arr.push({ name: argName, type: argType, default: argDefault, byRef: isByRef, output: isOutput });
                isByRef = false; isOutput = false; argName = ''; argType = ''; argDefault = '';
            } else {
                token += ch;
            }
        } else if (state === 2) { // Finding arg type
            if (ch === '=') {
                state = 3;
                argType = token;
                token = '';
            } else if (ch === ',') {
                state = 0;
                argType = token;
                token = '';
                arr.push({ name: argName, type: argType, default: argDefault, byRef: isByRef, output: isOutput });
                isByRef = false; isOutput = false; argName = ''; argType = ''; argDefault = '';
            } else if (ch === '(') {
                state = 21;
                token += ch;
            } else {
                token += ch;
            }
        } else if (state === 21) { // Inside type params
            if (ch === ')') {
                state = 2;
                token += ch;
            } else if (ch === '"') {
                state = 211;
                token += ch;
            } else {
                token += ch;
            }
        } else if (state === 211) { // Inside quoted string in type params
            if (ch === '"') {
                if (i < len - 1 && str.charAt(i + 1) === '"') {
                    i = i + 1;
                    token += ch + ch;
                } else {
                    state = 21;
                    token += ch;
                }
            } else {
                token += ch;
            }
        } else if (state === 3) { // Finding default value
            if (ch === ',') {
                state = 0;
                argDefault = token;
                token = '';
                arr.push({ name: argName, type: argType, default: argDefault, byRef: isByRef, output: isOutput });
                isByRef = false; isOutput = false; argName = ''; argType = ''; argDefault = '';
            } else if (ch === '{') {
                state = 31;
                token += ch;
            } else if (ch === '"') {
                state = 32;
                token += ch;
            } else {
                token += ch;
            }
        } else if (state === 31) { // Inside default expression {}
            if (ch === '}') {
                state = 3;
                token += ch;
            } else if (ch === '"') {
                state = 311;
                token += ch;
            } else {
                token += ch;
            }
        } else if (state === 311) { // Inside quoted string in default expression
            if (ch === '"') {
                if (i < len - 1 && str.charAt(i + 1) === '"') {
                    i = i + 1;
                    token += ch + ch;
                } else {
                    state = 31;
                    token += ch;
                }
            } else {
                token += ch;
            }
        } else if (state === 32) { // Inside quoted default value
            if (ch === '"') {
                if (i < len - 1 && str.charAt(i + 1) === '"') {
                    i = i + 1;
                    token += ch + ch;
                } else {
                    state = 3;
                    token += ch;
                }
            } else {
                token += ch;
            }
        }

        if (i === len - 1 && token !== '') {
            const mainstate = (state + '').charAt(0);
            if (mainstate === '1') {
                argName = token;
            } else if (mainstate === '2') {
                argType = token;
            } else if (mainstate === '3') {
                argDefault = token;
            }
            if (parseInt(mainstate) > 0) {
                arr.push({ name: argName, type: argType, default: argDefault, byRef: isByRef, output: isOutput });
            }
        }
    }
    return arr;
}

function formalSpec2Text(str: string): string {
    const arr = parseFormalSpec(str);
    return arr.map(item => {
        let itemText = '';
        if (item.byRef) {
            itemText += 'ByRef ';
        } else if (item.output) {
            itemText += 'Output ';
        }
        itemText += item.name;

        if (item.type) {
            itemText += ' As ' + item.type;
        }
        if (item.default) {
            const ch = item.default.charAt(0);
            if (ch !== '{' && ch !== '"' && !isValidNumber(item.default)) {
                itemText += ' = {' + item.default + '}';
            } else {
                itemText += ' = ' + item.default;
            }
        }

        return itemText;
    }).join(', ');
}

// ========== Type-Specific UDL Converters ==========

function parameter2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }

    text += 'Parameter ' + name;

    if (ooDef.Type) {
        text += ' As ' + ooDef.Type;
    }
    if (paramArr.length > 0) {
        text += '(' + paramArr.join(', ') + ')';
    }

    text += getOoDefPropertyText(ooDef, 'Parameter');

    if (ooDef.Expression) {
        text += ' = ' + block2Text(ooDef.Expression);
    } else if (ooDef.Default) {
        text += ' = ' + paramValue2Text(ooDef.Default);
    }

    text += ';' + LINE_FEED;
    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function property2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    if (ooDef.Relationship === '1') {
        text += 'Relationship ' + name;
    } else {
        text += 'Property ' + name;
    }
    if (ooDef.Type) {
        if (ooDef.Collection) {
            text += ' As ' + ooDef.Collection + ' Of ' + ooDef.Type;
        } else {
            text += ' As ' + ooDef.Type;
        }
    }
    if (paramArr.length > 0) {
        text += '(' + paramArr.join(', ') + ')';
    }

    text += getOoDefPropertyText(ooDef, 'Property');
    text += ';' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function foreignKey2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }

    text += 'ForeignKey ' + name;
    text += '(' + ooDef.Properties + ')';
    text += ' References ' + ooDef.ReferencedClass + '(' + ooDef.ReferencedKey + ')';

    text += getOoDefPropertyText(ooDef, 'ForeignKey');
    text += ';' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function index2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    text += 'Index ' + name;

    const indexFields: string[] = [];
    if (ooDef.Properties) {
        const props = ooDef.Properties.split(',');
        for (const prop of props) {
            const parts = prop.split(':');
            const fieldName = parts[0];
            const fieldType = parts[1];
            if (fieldType) {
                indexFields.push(fieldName + ' As ' + fieldType);
            } else {
                indexFields.push(fieldName);
            }
        }

        if (indexFields.length > 1) {
            text += ' On (' + indexFields.join(', ') + ')';
        } else if (ooDef.TypeClass) {
            text += ' On (' + indexFields[0] + ')';
        } else {
            text += ' On ' + indexFields[0] + '';
        }
    }

    if (ooDef.TypeClass) {
        text += ' As ' + ooDef.TypeClass;
        if (paramArr.length > 0) {
            text += '(' + paramArr.join(', ') + ')';
        }
    }

    text += getOoDefPropertyText(ooDef, 'Index');
    text += ';' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function method2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    let methodType = 'Method';
    if (ooDef.ClassMethod === '1') {
        methodType = 'Class' + methodType;
    }
    if (ooDef.ClientMethod === '1') {
        methodType = 'Client' + methodType;
    }
    text += methodType + ' ' + name;

    text += '(' + formalSpec2Text(ooDef.FormalSpec || '') + ')';

    if (ooDef.ReturnType) {
        text += ' As ' + ooDef.ReturnType;
    }
    if (ooDef.ReturnTypeParams) {
        text += '(' + ooDef.ReturnTypeParams + ')';
    }

    text += getOoDefPropertyText(ooDef, 'Method');
    text += LINE_FEED + '{' + LINE_FEED;
    text += ooDef.Implementation || '';
    text += '}' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function projection2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }

    text += 'Projection ' + name;

    if (ooDef.Type) {
        text += ' As ' + ooDef.Type;
    }
    if (paramArr.length > 0) {
        text += '(' + paramArr.join(', ') + ')';
    }

    text += getOoDefPropertyText(ooDef, 'Projection');
    text += ';' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function query2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    text += 'Query ' + name;

    text += '(' + formalSpec2Text(ooDef.FormalSpec || '') + ')';

    if (ooDef.Type) {
        text += ' As ' + ooDef.Type;
    }
    if (paramArr.length > 0) {
        text += '(' + paramArr.join(', ') + ')';
    }

    text += getOoDefPropertyText(ooDef, 'Query');
    text += LINE_FEED + '{' + LINE_FEED;

    if (ooDef.SqlQuery) {
        text += ooDef.SqlQuery + LINE_FEED;
    }

    text += '}' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function storage2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';
    let text = LINE_FEED;

    text += 'Storage ' + name + LINE_FEED + '{';

    // innerHTML equivalent - serialize all child nodes
    const children = getChildElements(node);
    for (const child of children) {
        text += child.toString();
    }

    text += '}' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function trigger2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    text += 'Trigger ' + name;

    text += getOoDefPropertyText(ooDef, 'Trigger');
    text += LINE_FEED + '{' + LINE_FEED;

    if (ooDef.Code) {
        text += ooDef.Code + LINE_FEED;
    }

    text += '}' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function udlText2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef } = parseComm(node);

    let text = '';
    if (ooDef.Content) {
        if (ooDef.Content.endsWith(LINE_FEED)) {
            text += ooDef.Content.substring(0, ooDef.Content.length - LINE_FEED.length);
        } else {
            text += ooDef.Content;
        }
    }
    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

function xData2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const { ooDef, paramArr } = parseComm(node);

    let text = LINE_FEED;
    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    text += 'XData ' + name;

    text += getOoDefPropertyText(ooDef, 'XData');
    text += LINE_FEED + '{' + LINE_FEED;

    if (ooDef.Data) {
        text += ooDef.Data + LINE_FEED;
    }

    text += '}' + LINE_FEED;

    return {
        title: node.tagName + ' ' + name,
        text: text,
    };
}

// ========== Main Converters ==========

function cls2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    const ooDef: OoDefMap = {};
    const arr: string[] = [];
    const children = getChildElements(node);

    for (const item of children) {
        let udl: UdlResult | null = null;
        const tagName = item.tagName;

        if (tagName === 'Property') {
            udl = property2Udl(item);
        } else if (tagName === 'Parameter') {
            udl = parameter2Udl(item);
        } else if (tagName === 'ForeignKey') {
            udl = foreignKey2Udl(item);
        } else if (tagName === 'Index') {
            udl = index2Udl(item);
        } else if (tagName === 'Method') {
            udl = method2Udl(item);
        } else if (tagName === 'Projection') {
            udl = projection2Udl(item);
        } else if (tagName === 'Query') {
            udl = query2Udl(item);
        } else if (tagName === 'Storage') {
            udl = storage2Udl(item);
        } else if (tagName === 'Trigger') {
            udl = trigger2Udl(item);
        } else if (tagName === 'UDLText') {
            udl = udlText2Udl(item);
        } else if (tagName === 'XData') {
            udl = xData2Udl(item);
        } else if (tagName === 'Description') {
            ooDef[tagName] = description2Udl(item).text;
        } else {
            ooDef[tagName] = item.textContent || '';
        }

        if (udl) {
            arr.push(udl.text);
        }
    }

    let text = '';
    if (ooDef.Copyright) {
        text += ooDef.Copyright + LINE_FEED + LINE_FEED;
    }
    if (ooDef.Import) {
        text += 'Import ' + multipleString2Text(ooDef.Import);
        text += LINE_FEED + LINE_FEED;
    }
    if (ooDef.IncludeCode) {
        text += 'Include ' + multipleString2Text(ooDef.IncludeCode);
        text += LINE_FEED + LINE_FEED;
    }
    if (ooDef.IncludeGenerator) {
        text += 'IncludeGenerator ' + multipleString2Text(ooDef.IncludeGenerator);
        text += LINE_FEED + LINE_FEED;
    }

    if (ooDef.Description) { text += ooDef.Description + LINE_FEED; }
    text += 'Class ' + name;
    if (ooDef.Super) {
        text += ' Extends ' + multipleString2Text(ooDef.Super);
    }

    text += getOoDefPropertyText(ooDef, 'Class');
    text = text + LINE_FEED + '{' + LINE_FEED;

    const allText = text + arr.join('') + LINE_FEED + '}';

    return {
        title: node.tagName + ' ' + name,
        language: 'cos',
        text: allText,
    };
}

function routine2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';
    return {
        title: node.tagName + ' ' + name,
        language: 'cos',
        text: node.textContent || '',
    };
}

function csp2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';
    return {
        title: node.tagName + ' ' + name,
        language: name.endsWith('.js') ? 'javascript' : 'html',
        text: node.textContent || '',
    };
}

function cspbase642Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';
    return {
        title: node.tagName + ' ' + name,
        language: '',
        text: node.textContent || '',
    };
}

function prj2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';

    // serialize inner XML
    let innerXml = '';
    const children = getChildElements(node);
    for (const child of children) {
        innerXml += child.toString();
    }

    return {
        title: node.tagName + ' ' + name,
        language: 'xml',
        text: innerXml,
    };
}

function unknown2Udl(node: Element): UdlResult {
    const name = getAttribute(node, 'name') || '';
    return {
        title: node.tagName + ' ' + name,
        language: '',
        text: node.textContent || '',
    };
}

// ========== Main xml2Udl Function ==========

/**
 * Converts an XML element to its UDL representation.
 * @param node The XML element to convert
 * @returns UdlResult with the generated UDL text
 */
export function xml2Udl(node: Element): UdlResult {
    const tagName = node.tagName.toLowerCase();

    switch (tagName) {
        case 'project':
            return prj2Udl(node);
        case 'class':
            return cls2Udl(node);
        case 'csp':
            return csp2Udl(node);
        case 'routine':
            return routine2Udl(node);
        case 'cspbase64':
            return cspbase642Udl(node);
        default:
            return unknown2Udl(node);
    }
}

/**
 * Serializes an XML element back to its XML string representation.
 */
export function serializeXmlElement(node: Element): string {
    return node.toString();
}

// ========== File Parsing ==========

/**
 * Parses an XML file content string and builds a tree structure.
 * @param fileName The name of the XML file
 * @param xmlContent The content of the XML file as a string
 * @returns ParsedFile with tree structure and XML element map
 */
export function parseXmlFile(fileName: string, xmlContent: string): ParsedFile {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    const rootElements = doc.getElementsByTagName('Export');
    if (!rootElements || rootElements.length === 0) {
        // Try to treat the document itself as having child elements
        const docChildren = getChildElements(doc as unknown as Element);
        if (docChildren.length > 0) {
            return buildTreeFromChildren(fileName, docChildren);
        }
        return {
            fileName,
            tree: { id: 'empty', text: 'No Export element found', tagName: 'empty', children: [] },
            xmlMap: {},
        };
    }

    const root = rootElements[0];
    const rootChildren = getChildElements(root);
    return buildTreeFromChildren(fileName, rootChildren);
}

function buildTreeFromChildren(fileName: string, children: Element[]): ParsedFile {
    const typeGroups: Record<string, TreeItemData> = {};
    const xmlMap: Record<string, string> = {};
    let itemIndex = 0;

    for (const item of children) {
        let tagName = item.tagName.toLowerCase();

        // CSP with .js extension gets a special type name
        if (tagName === 'csp' && getAttribute(item, 'name') && getAttribute(item, 'name')!.endsWith('.js')) {
            tagName = 'javascript';
        }

        if (!typeGroups[tagName]) {
            typeGroups[tagName] = {
                id: 'file0-' + tagName,
                text: tagName,
                tagName: tagName,
                children: [],
            };
        }

        const childId = tagName + '-' + (typeGroups[tagName].children!.length);
        let itemName = getAttribute(item, 'name') || '(unnamed)';

        // Routine: append type as file extension (e.g., websys + INC → websys.inc)
        if (tagName === 'routine') {
            const routineType = getAttribute(item, 'type');
            if (routineType && routineType !== 'CLS') {
                itemName = itemName + '.' + routineType.toLowerCase();
            }
        }

        // Store the XML element as outerHTML for lazy UDL generation
        xmlMap[childId] = item.toString();

        typeGroups[tagName].children!.push({
            id: childId,
            text: itemName,
            tagName: tagName,
            xmlOuterHTML: item.toString(),
        });

        itemIndex++;
    }

    const typeList: TreeItemData[] = [];
    for (const key in typeGroups) {
        typeList.push(typeGroups[key]);
    }

    return {
        fileName,
        tree: {
            id: 'file0',
            text: fileName,
            tagName: 'root',
            children: typeList,
        },
        xmlMap,
    };
}

/**
 * Generates UDL from an XML element string.
 * @param xmlOuterHTML The XML element serialized as a string
 * @returns UdlResult
 */
export function generateUdlFromXmlElement(xmlOuterHTML: string): UdlResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlOuterHTML, 'text/xml');
    const element = doc.documentElement;
    if (element) {
        return xml2Udl(element);
    }
    return { title: 'Error', text: 'Could not parse XML element' };
}

