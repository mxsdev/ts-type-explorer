import { TypeInfo, TypeId, getTypeInfoChildren, SymbolInfo, SignatureInfo, IndexInfo } from '@ts-expand-type/api'
import assert = require('assert');
import * as vscode from 'vscode'
import * as ts from 'typescript'
import { getKindText, getPrimitiveKindText } from '../localization';
import { StateManager } from '../state/stateManager';

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

    createTypeNode(typeInfo: TypeInfo, parent: TypeTreeItem|undefined, args?: TypeNodeArgs) {
        return new TypeNode(typeInfo, this, parent, args)
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

    createChildTypeNode(typeInfo: TypeInfo, args?: TypeNodeArgs) {
        return this.provider.createTypeNode(typeInfo, this, args)
    }

    createSigatureNode(signature: SignatureInfo) {
        return new SignatureNode(signature, this.provider, this)
    }

    createIndexNode(indexInfo: IndexInfo) {
        return new IndexNode(indexInfo, this.provider, this)
    }

    getSignatureChildren(signature: SignatureInfo): TypeNode[] {
        return [
            ...signature.parameters.map(param => this.createChildTypeNode(param)),
            this.createChildTypeNode(signature.returnType, { purpose: 'return' }),
        ]
    }
}

class TypeNode extends TypeTreeItem {
    typeTree: ResolvedTypeInfo

    constructor(
        typeTree: TypeInfo,
        provider: TypeTreeProvider,
        parent: TypeTreeItem|undefined,
        private args?: TypeNodeArgs,
    ) {
        const symbolMeta = typeTree.symbolMeta
        let dimension = 0

        while(typeTree.kind === 'array' || typeTree.kind === 'reference') {
            if(typeTree.kind === 'array') {
                dimension++
                typeTree = typeTree.type
            } else {
                typeTree = provider.resolveTypeReference(typeTree)
            }
        }

        const resolvedTypeTree = {...typeTree, symbolMeta} as ResolvedTypeInfo

        const { label, description, isCollapsible } = generateTypeNodeMeta(resolvedTypeTree, dimension, args)
        super(label, vscode.TreeItemCollapsibleState.None, provider, parent)

        if(isCollapsible) {
            this.collapsibleState = this.depth > 1 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded
        }

        this.typeTree = resolvedTypeTree
        this.description = description
    }
    
    getChildren(): TypeTreeItem[] {
        const { kind } = this.typeTree

        const toTreeNodeArgs = (info: TypeInfo, args?: TypeNodeArgs) => this.createChildTypeNode(info, args)
        const toTreeNode = (info: TypeInfo) => toTreeNodeArgs(info)

        switch(kind) {
            case "object": {
                const { properties, indexInfos = [] } = this.typeTree
                return [
                    ...indexInfos.map(info => this.createIndexNode(info)),
                    ...properties.map(toTreeNode),
                ]
            }

            case "function": {
                const { signatures } = this.typeTree
                
                if(signatures.length === 1) {
                    return this.getSignatureChildren(signatures[0])
                } else {
                    return signatures.map(sig => this.createSigatureNode(sig))
                }
            }

            case "array": {
                throw new Error("Tried to get children for array type")
            }

            case "tuple": {
                const { types } = this.typeTree
                return types.map(toTreeNode)
            }

            case "conditional": {
                const { checkType, extendsType, trueType, falseType } = this.typeTree

                return [
                    toTreeNodeArgs(checkType, { purpose: 'conditional_check' }),
                    toTreeNodeArgs(extendsType, { purpose: 'conditional_extends'}),
                    ...trueType ? [toTreeNodeArgs(trueType, { purpose: 'conditional_true' })] : [],
                    ...falseType ? [toTreeNodeArgs(falseType, { purpose: 'conditional_false' })] : [],
                ]
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

class SignatureNode extends TypeTreeItem {
    constructor(
        private signature: SignatureInfo,
        provider: TypeTreeProvider,
        parent: TypeTreeItem|undefined,
    ) {
        super(signature.symbolMeta?.name ?? "", vscode.TreeItemCollapsibleState.Collapsed, provider, parent)
        this.description = "signature"
    }

    getChildren() {
        return this.getSignatureChildren(this.signature)
    }
}

class IndexNode extends TypeTreeItem {
    constructor(
        private indexInfo: IndexInfo,
        provider: TypeTreeProvider,
        parent: TypeTreeItem|undefined
    ) {
        super(indexInfo.parameterSymbol?.name ?? "", vscode.TreeItemCollapsibleState.Collapsed, provider, parent)
        this.description = "index"
    }

    getChildren() {
        return [
            ...this.indexInfo.keyType ? [this.createChildTypeNode(this.indexInfo.keyType, { purpose: 'index_type'})] : [],
            ...this.indexInfo.type ? [this.createChildTypeNode(this.indexInfo.type, { purpose: 'index_value_type'})] : [],
        ]
    }
}

type TypeNodeArgs = {
    purpose?: 'return'|'index_type'|'index_value_type'|'conditional_check'|'conditional_extends'|'conditional_true'|'conditional_false',
    optional?: boolean,
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

function generateTypeNodeMeta(info: ResolvedTypeInfo, dimension: number, {purpose, optional}: TypeNodeArgs = {}) {
    const isOptional = info.symbolMeta?.optional || optional || ((info.symbolMeta?.flags ?? 0) & ts.SymbolFlags.Optional)
    const isRest = info.symbolMeta?.rest

    let description = getBaseDescription()
    description += "[]".repeat(dimension)
    
    if(isOptional) {
        description += '?'
    }

    if(isRest) {
        description = "..." + description
    }

    return {
        label: getLabel(),
        description,
        isCollapsible: kindHasChildren(info.kind)
    }

    function getLabel() {
        const nameByPurpose: Partial<Record<NonNullable<TypeNodeArgs['purpose']>, string>> = {
            return: "return",
            index_type: "constraint",
            index_value_type: "value",
            conditional_check: "check",
            conditional_extends: "extends",
            conditional_true: "true",
            conditional_false: "false",
        }

        if(purpose && purpose in nameByPurpose) {
            return `<${nameByPurpose[purpose]!}>`
        }

        return !info.symbolMeta?.anonymous ? (info.symbolMeta?.name ?? "") : ""
    }

    function getBaseDescription() {
        switch(info.kind) {
            case "type_parameter": {
                const name = info.symbolMeta?.name
                const kindText = getKindText('type_parameter')

                return name ? `${name} (${kindText})` : kindText
            }

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
           || kind === 'tuple'
           || kind === 'function'
}