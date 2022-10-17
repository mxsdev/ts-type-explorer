import { TypeInfo, TypeId, getTypeInfoChildren, SymbolInfo, SignatureInfo, IndexInfo, pseudoBigIntToString, LocalizedTypeInfo, localizeTypeInfo, TypeInfoMap, generateTypeInfoMap, getLocalizedTypeInfoChildren, SourceFileLocation } from '@ts-expand-type/api'
import assert = require('assert');
import * as vscode from 'vscode'
import { StateManager } from '../state/stateManager';
import { fromFileLocationRequestArgs, rangeFromLineAndCharacters } from '../util';

const { None: NoChildren, Expanded, Collapsed } = vscode.TreeItemCollapsibleState

export class TypeTreeProvider implements vscode.TreeDataProvider<TypeTreeItem> {
    constructor(private stateManager: StateManager) { }

    private typeInfoMap: TypeInfoMap = new Map()

    private _onDidChangeTreeData: vscode.EventEmitter<TypeTreeItem | undefined | null | void> = new vscode.EventEmitter<TypeTreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<TypeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    refresh(): void {
        this.typeInfoMap.clear()
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TypeTreeItem) {
        return element
    }
    
    async getChildren(element?: TypeTreeItem): Promise<TypeTreeItem[]> {
        if(!element) {
            const typeInfo = this.stateManager.getTypeTree()
            if(!typeInfo) { return [] }

            this.typeInfoMap = generateTypeInfoMap(typeInfo)
            const localizedTypeInfo = localizeTypeInfo(typeInfo, this.typeInfoMap)

            return [this.createTypeNode(localizedTypeInfo, /* root */ undefined)]
        } else {
            return getLocalizedTypeInfoChildren(element.typeInfo, this.typeInfoMap).map(info => this.createTypeNode(info, element))
        }
    }

    createTypeNode(typeInfo: LocalizedTypeInfo, parent: TypeTreeItem|undefined) {
        return new TypeTreeItem(typeInfo, this, parent)
    }
}

export class TypeTreeItem extends vscode.TreeItem {
    protected depth: number

    constructor(
        public typeInfo: LocalizedTypeInfo,
        private provider: TypeTreeProvider,
        protected parent?: TypeTreeItem
    ) {
        const { label, description } = getMeta(typeInfo)

        const depth = (parent?.depth ?? 0) + 1
        const collapsibleState = (typeInfo.children?.length ?? 0) === 0 ? NoChildren : depth === 1 ? Expanded : Collapsed

        super(label, collapsibleState)

        this.depth = depth
        this.description = description

        if(typeInfo.locations && typeInfo.locations && typeInfo.locations.length > 0) {
            this.command = getOpenCommand(typeInfo.locations[0])
        }
    }

    createTypeNode(typeInfo: LocalizedTypeInfo) {
        return this.provider.createTypeNode(typeInfo, this)
    }
}

function getMeta(info: LocalizedTypeInfo) {
    let nameOverridden = false

    const label = getLabel()
    const description = getDescription()

    return {
        label, description
    }

    function getLabel() {
        const base = getLabelBase()

        if(!base) {
            return base
        }

        return addDecorations(base, { optional: info.optional, rest: info.rest })

        function getLabelBase() {
            nameOverridden = true
    
            if(info.name !== undefined) {
                return info.name
            }
    
            if(info.purpose) {
                return `<${info.purpose}>`
            }
    
            nameOverridden = false
            return !info.symbol?.anonymous ? (info.symbol?.name ?? "") : ""
        }
    }

    function getDescription() {
        if(!info.kindText) {
            return undefined
        }

        const decorate = (text: string) => addDecorations(text, { dimension: info.dimension })

        const baseDescription = decorate(info.kindText)

        const aliasDescriptionBase = info.alias ?? (nameOverridden && info.symbol?.name)
        const aliasDescription = (aliasDescriptionBase) && decorate(aliasDescriptionBase)

        return aliasDescription ? `${aliasDescription} (${baseDescription})` : baseDescription
    }
}

function addDecorations(text: string, decorations: { rest?: boolean, optional?: boolean, dimension?: number }) {
    const { rest = false, optional = false, dimension = 0 } = decorations

    text += "[]".repeat(dimension)
    
    if(optional) {
        text += '?'
    }

    if(rest) {
        text = "..." + text
    }

    return text
}

function getOpenCommand(location: SourceFileLocation): vscode.Command {
    // TODO: bail if file does not exist

    const range = {
        start: (location.range.start),
        end: (location.range.end),
    }

    const args: [ vscode.Uri, vscode.TextDocumentShowOptions] = [
        vscode.Uri.file(location.fileName),
        {
            selection: rangeFromLineAndCharacters(range.start, range.end)
        }
    ]

    return {
        // command: "typescript-explorer.goToTypeInTypeTreeView",
        command: "vscode.open",
        title: "Go To Type",
        arguments: args,
    }
}