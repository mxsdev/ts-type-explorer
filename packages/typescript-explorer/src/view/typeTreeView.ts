import { TypeInfo, TypeId, getTypeInfoChildren, SymbolInfo } from '@ts-expand-type/api'
import assert = require('assert');
import * as vscode from 'vscode'
import * as ts from 'typescript'
import { getKindText, getPrimitiveKindText } from '../localization';
import { StateManager } from '../state/stateManager';

// TODO: array types
// TODO: mapped types, function types

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

            return [this.createTypeNode(typeInfo, /* root */ undefined)]
        } else {
            return element.getChildren()
        }
    }

    private populateCache(tree: TypeInfo) {
        if(tree.kind === 'reference') { return }
        this.itemCache.set(tree.id, tree)
        getTypeInfoChildren(tree).forEach(c => this.populateCache(c))
    }

    resolveTypeReference(typeInfo: TypeInfo): ResolvedTypeInfo {
        if(typeInfo.kind === 'reference') {
            const resolvedTypeInfo = this.itemCache.get(typeInfo.id)
            assert(resolvedTypeInfo, "Encountered invalid type reference!")
            return resolvedTypeInfo
        }

        return typeInfo
    }

    createTypeNode(typeInfo: TypeInfo, parent: TypeTreeItem|undefined) {
        return new TypeNode(typeInfo, this, parent)
    }
}

abstract class TypeTreeItem extends vscode.TreeItem {
    protected depth: number

    constructor(
        label: string, collapsibleState: vscode.TreeItemCollapsibleState,
        private provider: TypeTreeProvider, 
        protected parent?: TypeTreeItem
    ) {
        super(label, collapsibleState)
        this.depth = (parent?.depth ?? 0) + 1
    }

    abstract getChildren(): TypeTreeItem[]

    isCollapsible(): boolean {
        return this.collapsibleState !== vscode.TreeItemCollapsibleState.None
    }

    createChildTypeNode(typeInfo: TypeInfo) {
        return this.provider.createTypeNode(typeInfo, this)
    }
}

class TypeNode extends TypeTreeItem {
    typeTree: ResolvedTypeInfo

    constructor(
        typeTree: TypeInfo,
        provider: TypeTreeProvider,
        parent: TypeTreeItem|undefined,
    ) {
        const resolvedTypeTree: ResolvedTypeInfo = typeTree.kind === 'reference' ? { 
            ...provider.resolveTypeReference(typeTree),
            symbolMeta: typeTree.symbolMeta
        } : typeTree
        
        const { label, description, isCollapsible } = generateTypeNodeMeta(resolvedTypeTree)
        super(label, vscode.TreeItemCollapsibleState.None, provider, parent)

        if(isCollapsible) {
            this.collapsibleState = this.depth > 1 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded
        }

        this.typeTree = resolvedTypeTree
        this.description = description
    }
    
    getChildren(): TypeTreeItem[] {
        const { kind } = this.typeTree

        const toTreeNode = (info: TypeInfo) => this.createChildTypeNode(info)

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

class TypeNodeGroup extends TypeTreeItem {
    constructor(
        label: string,
        provider: TypeTreeProvider,
        parent: TypeTreeItem|undefined,
        public children: TypeInfo[],
    ) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed, provider, parent)
    }

    getChildren(): TypeTreeItem[] {
        return this.children.map(c => this.createChildTypeNode(c))
    }
}

function generateTypeNodeMeta(info: ResolvedTypeInfo) {
    const isOptional = (info.symbolMeta?.flags ?? 0) & ts.SymbolFlags.Optional

    let description = getBaseDescription()
    if(isOptional) {
        description += '?'
    }

    return {
        label: !info.symbolMeta?.anonymous ? (info.symbolMeta?.name ?? "") : "",
        description,
        // TODO: open root level node by default...
        isCollapsible: kindHasChildren(info.kind)
    }

    function getBaseDescription() {
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