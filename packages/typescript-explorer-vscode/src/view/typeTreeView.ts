/* eslint-disable @typescript-eslint/require-await */

import {
    LocalizedTypeInfoOrError,
    ExtensionTreeProviderImpl,
    ExtensionTreeNodeImpl,
    ExtensionTreeCollapsibleState, 
    ExtensionTreeItemMeta, 
    ExtensionTreeNode, 
    SourceFileLocation,
    ExtensionTreeSymbol,
} from "@ts-type-explorer/api"
import * as vscode from "vscode"
import { StateManager } from "../state/stateManager"
import { logError, rangeFromLineAndCharacters, showError } from "../util"
import { getQuickInfoAtLocation, getTypeTreeAtLocation } from "../server"
import { ExtensionMarkdown, ExtensionTreeChildrenUpdateInfo } from "@ts-type-explorer/api/dist/types"

export class TypeTreeProvider extends ExtensionTreeProviderImpl<TypeTreeItem> implements vscode.TreeDataProvider<TypeTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<void | TypeTreeItem | TypeTreeItem[] | null | undefined>()
    onDidChangeTreeData = this._onDidChangeTreeData.event

    private _onDidGetChildren = new vscode.EventEmitter<ExtensionTreeChildrenUpdateInfo<TypeTreeItem>>()
    onDidGetChildren = this._onDidGetChildren.event

    protected _fireOnDidChangeTreeData(data: void | TypeTreeItem | TypeTreeItem[] | null | undefined): void {
        this._onDidChangeTreeData.fire(data)
    }

    protected _fireOnDidGetChildren(data: ExtensionTreeChildrenUpdateInfo<TypeTreeItem>): void {
        this._onDidGetChildren.fire(data)
    }

    constructor(
        private stateManager: StateManager
    ) { 
        super(
            (typeInfo, parent) => new TypeTreeItem(typeInfo, this.stateManager, parent),
            stateManager.getTypeTree.bind(stateManager),
            getTypeTreeAtLocation,
            getQuickInfoAtLocation,
            (e, msg) => {
                logError(e, msg)
                showError(msg)
            }
        )
    }

    getTreeItem(element: TypeTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: TypeTreeItem | undefined): Promise<TypeTreeItem[]> {
        const extensionConfig = this.stateManager.getConfiguration()
        return await this.generateTree(element, extensionConfig)
    }

    async resolveTreeItem?(item: vscode.TreeItem, element: TypeTreeItem): Promise<vscode.TreeItem> {
        const result = await this.resolveNode(element)
        return result
    }

}

export class TypeTreeItem extends vscode.TreeItem implements ExtensionTreeNode {
    wrapped: ExtensionTreeNodeImpl<TypeTreeItem>

    constructor(
        typeInfo: LocalizedTypeInfoOrError, 
        private stateManager: StateManager,
        parent?: TypeTreeItem | undefined,
    ) {
        const wrapped = new ExtensionTreeNodeImpl(typeInfo, parent)

        const {
            label,
            collapsibleState,
        } = wrapped.meta

        super(label, convertCollapsibleState(collapsibleState))

        this.wrapped = wrapped
        
        this.updateMeta()
    }

    goToDefinition() {
        const location = this.getNextDefinition()
        
        const args: [vscode.Uri, vscode.TextDocumentShowOptions] = [
            vscode.Uri.file(location.fileName),
            {
                selection: rangeFromLineAndCharacters(
                    location.range.start,
                    location.range.end
                ),
            },
        ]

        vscode.commands.executeCommand("vscode.open", ...args)
    }

    get meta(): ExtensionTreeItemMeta {
        return this.wrapped.meta
    }

    get typeInfo(): LocalizedTypeInfoOrError {
        return this.wrapped.typeInfo
    }

    get depth(): number {
        return this.wrapped.depth
    }

    getNextDefinition(): SourceFileLocation {
        return this.wrapped.getNextDefinition()
    }

    updateMeta(meta?: Partial<ExtensionTreeItemMeta>): void {
        if (meta) {
            return this.wrapped.updateMeta(meta)
        }
        
        const {
            label,
            description,
            contextValue,
            symbol,
            collapsibleState,
            tooltip,
        } = this.wrapped.meta

        const { iconColorsEnabled, iconsEnabled } = this.stateManager.getConfiguration()
        
        this.iconPath = iconsEnabled ? getSymbolIcon(symbol, iconColorsEnabled) : undefined
        this.tooltip = convertMarkdownText(tooltip)

        this.description = description
        this.contextValue = contextValue
        this.label = label
        this.collapsibleState = convertCollapsibleState(collapsibleState)
    }
}

const COLLAPSIBLE_STATE = {
    none: vscode.TreeItemCollapsibleState.None,
    expanded: vscode.TreeItemCollapsibleState.Expanded,
    collapsed: vscode.TreeItemCollapsibleState.Collapsed,
} as const

function convertCollapsibleState(state: ExtensionTreeCollapsibleState): vscode.TreeItemCollapsibleState {
    return COLLAPSIBLE_STATE[state]
}

function convertMarkdownText(markdownText: ExtensionMarkdown | string | undefined): vscode.MarkdownString | string | undefined {
    if (typeof markdownText === 'string' || typeof markdownText === 'undefined') {
        return markdownText
    }

    const result = new vscode.MarkdownString()
    result.baseUri = markdownText.baseUri

    for (const mdNode of markdownText) {
        switch (mdNode.type) {
            case 'codeblock': {
                result.appendCodeblock(mdNode.content, mdNode.lang)
            } break

            case 'markdown': {
                result.appendMarkdown(mdNode.content)
            } break

            case 'text': {
                result.appendText(mdNode.content)
            } break
        }
    }

    return result
}

const VSCodeIconTable: Record<ExtensionTreeSymbol, [id: string, colorId?: string]> = {
    error: ["error", "errorForeground"],
    field: ["symbol-field"],
    property: ["symbol-property"],
    constructor: ["symbol-constructor"],
    string: ["symbol-string"],
    number: ["symbol-number"],
    numeric: ["symbol-numeric"],
    boolean: ["symbol-boolean"],
    null: ["symbol-null"],
    never: ["symbol-never"],
    object: ["symbol-object"],
    "type-parameter": ["symbol-type-parameter"],
    text: ["symbol-text"],
    enum: ["symbol-enum"],
    "enum-member": ["symbol-enum-member"],
    array: ["symbol-array"],
    keyword: ["symbol-keyword"],
    condition: ["question", "symbolIcon.keywordForeground"],
    misc: ["symbol-misc"],
    union: ["symbol-struct"],
    intersection: ["symbol-struct"],
    method: ["symbol-method"],
    function: ["symbol-function"],
    interface: ["symbol-interface"],
    namespace: ["symbol-namespace"],
    module: ["symbol-module"],
    class: ["symbol-class"],
    index: ["key", "symbolIcon.keyForeground"],
}

function getSymbolIcon(s: ExtensionTreeSymbol | undefined, iconColorsEnabled: boolean): vscode.ThemeIcon {
    const iconIds = s ? VSCodeIconTable[s] : ["symbol-misc"]
    
    const [id] = iconIds
    let [colorId] = iconIds

    if (!iconColorsEnabled) {
        colorId = "icon.foreground"
    }

    return !colorId
        ? new vscode.ThemeIcon(id)
        : new vscode.ThemeIcon(id, new vscode.ThemeColor(colorId))
}