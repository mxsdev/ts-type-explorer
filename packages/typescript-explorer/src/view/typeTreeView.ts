import { TypeInfo, TypeId, getTypeInfoChildren } from '@ts-expand-type/api'
import assert = require('assert');
import * as vscode from 'vscode'
import * as ts from 'typescript'
import { getKindText, getPrimitiveKindText } from '../localization';
import { StateManager } from '../state/stateManager';

// TODO: anonymous types have the name '__type'

type ResolvedTypeInfo = Exclude<TypeInfo, {kind: 'reference'}>
type TreeCache = Map<TypeId, ResolvedTypeInfo>

export class TypeTreeProvider implements vscode.TreeDataProvider<TypeTreeItem> {
    constructor(private stateManager: StateManager) { }

    private itemCache: TreeCache = new Map()

    private _onDidChangeTreeData: vscode.EventEmitter<TypeTreeItem | undefined | null | void> = new vscode.EventEmitter<TypeTreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<TypeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    refresh(): void {
        this.itemCache.clear()
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TypeTreeItem) {
        return element
    }
    
    async getChildren(element?: TypeTreeItem): Promise<TypeTreeItem[]> {
        if(!element) {
            const typeInfo = this.stateManager.getTypeTree()
            if(!typeInfo) { return [] }

            this.populateCache(typeInfo)

            return [new TypeNode(this.resolveTypeReference(typeInfo), this)]
        } else {
            return element.getChildren()
        }
    }

    private populateCache(tree: TypeInfo) {
        if(tree.kind === 'reference') { return }
        this.itemCache.set(tree.id, tree)
        getTypeInfoChildren(tree).forEach(c => this.populateCache(c))
    }

    private resolveTypeReference(typeInfo: TypeInfo): ResolvedTypeInfo {
        if(typeInfo.kind === 'reference') {
            const resolvedTypeInfo = this.itemCache.get(typeInfo.id)
            assert(resolvedTypeInfo, "Encountered invalid type reference!")
            return resolvedTypeInfo
        }

        return typeInfo
    }

    createTypeNode(typeInfo: TypeInfo) {
        return new TypeNode(this.resolveTypeReference(typeInfo), this)
    }
}

type TypeTreeItem = TypeNode | TypeNodeGroup

class TypeNode extends vscode.TreeItem {
    constructor(
        public readonly typeTree: ResolvedTypeInfo,
        private provider: TypeTreeProvider
    ) {
        const { label, description, collapsibleState } = generateTypeNodeMeta(typeTree)
        super(label, collapsibleState)

        this.description = description
    }

    
    getChildren(): TypeTreeItem[] {
        const { kind } = this.typeTree

        const toTreeNode = (info: TypeInfo) => this.provider.createTypeNode(info)

        switch(kind) {
            case "object": {
                const { properties, signatures, indexInfos } = this.typeTree
                return properties.map(toTreeNode)
            }

            // TODO: intersection properties
            case "intersection":
            case "union": {
                const { types } = this.typeTree
                return types.map(toTreeNode)
            }

            case "primitive":
            case "bigint_literal":
            case "boolean_literal":
            case "enum_literal":
            case "number_literal":
            default: {
                return []
                break
            }
        }
    }
}

class TypeNodeGroup extends vscode.TreeItem {
    constructor(
        label: string,
        public children: TypeInfo[],
        private provider: TypeTreeProvider
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed)
    }

    getChildren(): TypeTreeItem[] {
        return this.children.map(c => this.provider.createTypeNode(c))
    }
}

function generateTypeNodeMeta(info: ResolvedTypeInfo) {
    const baseDescription = (function () {
        switch(info.kind) {
            case "primitive": {
                return getPrimitiveKindText(info.primitive)
            }

            case "bigint_literal":
            case "boolean_literal":
            case "enum_literal":
            case "string_literal":
            case "number_literal": {
                return getKindText(info.kind, info.value)
            }

            default: {
                return getKindText(info.kind)
            }
        }
    })()

    const isOptional = (info.symbolMeta?.flags ?? 0) & ts.SymbolFlags.Optional

    let description = baseDescription
    if(isOptional) {
        description += '?'
    }

    return {
        label: info.symbolMeta?.name ?? "<anonymous>",
        description,
        // TODO: open root level node by default...
        collapsibleState: kindHasChildren(info.kind) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    }
}

type TypeInfoKind = TypeInfo['kind']
function kindHasChildren(kind: TypeInfoKind) {
    return kind === 'conditional' 
           || kind === 'object'      
           || kind === 'index'      
           || kind === 'indexed_access'      
           || kind === 'substitution'      
           || kind === 'union'      
           || kind === 'intersection'
}