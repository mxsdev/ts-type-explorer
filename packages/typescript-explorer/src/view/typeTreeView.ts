import { TypeInfo, TypeId, getTypeInfoChildren, SymbolInfo, SignatureInfo, IndexInfo, pseudoBigIntToString, LocalizedTypeInfo, TypeInfoMap, SourceFileLocation, TypeInfoLocalizer, localizePurpose } from '@ts-expand-type/api'
import assert = require('assert');
import * as vscode from 'vscode'
import { TSExplorer } from '../config';
import { markdownDocumentation } from '../markdown';
import { StateManager } from '../state/stateManager';
import { fromFileLocationRequestArgs, getQuickInfoAtPosition, rangeFromLineAndCharacters } from '../util';

const { None: NoChildren, Expanded, Collapsed } = vscode.TreeItemCollapsibleState

export class TypeTreeProvider implements vscode.TreeDataProvider<TypeTreeItem> {
    constructor(private stateManager: StateManager) { }

    private typeInfoLocalizer: TypeInfoLocalizer|undefined

    private _onDidChangeTreeData: vscode.EventEmitter<TypeTreeItem | undefined | null | void> = new vscode.EventEmitter<TypeTreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<TypeTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    refresh(): void {
        this.typeInfoLocalizer = undefined
        this._onDidChangeTreeData.fire()
    }

    async getTreeItem(element: TypeTreeItem) {
        if(element.typeInfo.locations) {
            for(const location of element.typeInfo.locations) {
                const { documentation, tags } = await getQuickInfoAtPosition(location.fileName, location.range.start) ?? { }

                if(documentation) {
                    element.tooltip = markdownDocumentation(documentation, tags ?? [], vscode.Uri.file(location.fileName))
                    break
                }
            }
        }

        return element
    }
    
    async getChildren(element?: TypeTreeItem): Promise<TypeTreeItem[]> {
        if(!element) {
            const typeInfo = this.stateManager.getTypeTree()
            if(!typeInfo) { return [] }

            this.typeInfoLocalizer = new TypeInfoLocalizer(typeInfo)
            const localizedTypeInfo = this.typeInfoLocalizer.localize(typeInfo)

            return [this.createTypeNode(localizedTypeInfo, /* root */ undefined)]
        } else {
            return this.typeInfoLocalizer!
                .localizeChildren(element.typeInfo).map(info => this.createTypeNode(info, element))
                .filter(({ typeInfo: { purpose }}) => TSExplorer.Config.TypeTreeView.showTypeParameterInfo() || !(purpose === 'type_argument_list' || purpose === 'type_parameter_list'))
                .filter(({ typeInfo: { purpose }}) => TSExplorer.Config.TypeTreeView.showBaseClassInfo() || !(purpose === "class_base_type" || purpose === "class_implementations" || purpose === "object_class"))
        }
    }

    createTypeNode(typeInfo: LocalizedTypeInfo, parent: TypeTreeItem|undefined) {
        return new TypeTreeItem(typeInfo, this, parent)
    }
}

type TypeTreeItemContextValue = "declared"
export class TypeTreeItem extends vscode.TreeItem {
    protected depth: number

    constructor(
        public typeInfo: LocalizedTypeInfo,
        private provider: TypeTreeProvider,
        protected parent?: TypeTreeItem
    ) {
        const { label, description, contextValue, icon } = getMeta(typeInfo)

        const depth = (parent?.depth ?? 0) + 1
        const collapsibleState = (typeInfo.children?.length ?? 0) === 0 ? NoChildren : depth === 1 ? Expanded : Collapsed

        super(label, collapsibleState)

        this.depth = depth
        this.description = description
        this.contextValue = contextValue
        this.iconPath = icon
    }

    protected createTypeNode(typeInfo: LocalizedTypeInfo) {
        return this.provider.createTypeNode(typeInfo, this)
    }

    private definitionIndex = 0
    
    goToDefinition() {
        assert(this.typeInfo.locations && this.typeInfo.locations.length > 0, "Type has no locations!")

        const location = this.typeInfo.locations[this.definitionIndex]
        this.definitionIndex = (this.definitionIndex + 1) % this.typeInfo.locations.length

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

        vscode.commands.executeCommand("vscode.open", ...args)
    }
}

type TypeTreeItemMeta = {
    label: string,
    description?: string,
    contextValue?: TypeTreeItemContextValue,
    icon?: vscode.ThemeIcon,
}

function getMeta(info: LocalizedTypeInfo): TypeTreeItemMeta {
    let nameOverridden = false

    const label = getLabel()
    const description = getDescription()

    return {
        label,
        description, 
        contextValue: getContextValue(),
        icon: getIcon(),
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
                return `<${localizePurpose(info.purpose)}>`
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

    function getContextValue(): TypeTreeItemContextValue|undefined {
        return info.locations && info.locations.length > 0 ? "declared" : undefined
    }

    type IconId = [id: string, colorId?: string]

    function getIcon(): vscode.ThemeIcon|undefined {
        if(!TSExplorer.Config.TypeTreeView.iconsEnabled()) {
            return undefined
        }

        const iconIds = _getIcon()
        if(!iconIds) {
            return undefined
        }

        let [ id, colorId ] = iconIds

        if(!TSExplorer.Config.TypeTreeView.iconColorsEnabled()) {
            colorId = "icon.foreground"
        }

        return !colorId ? new vscode.ThemeIcon(id) : new vscode.ThemeIcon(id, new vscode.ThemeColor(colorId))

        function _getIcon(): IconId|undefined {
            if(info.symbol?.property) {
                return ["symbol-field"]
            }

            if(info.symbol?.isArgument) {
                return ["symbol-property"]
            }

            switch(info.purpose) {
                case "class_constructor": {
                    return ["symbol-constructor"]
                }
            }

            switch(info.kind) {
                case "primitive": {
                    switch(info.primitiveKind) {
                        case "essymbol":
                        case "unique_symbol":
                        case "string": {
                            return ["symbol-string"]
                        }

                        case "bigint":
                        case "number": {
                            return ["symbol-numeric"]
                        }

                        case "boolean": {
                            return ["symbol-boolean"]
                        }

                        case "unknown":
                        case "any":
                        case "void":
                        case "undefined":
                        case "null": {
                            return ["symbol-null"]
                        }

                        case "never": {
                            return ["error", "symbolIcon.nullForeground"]
                        }

                        default: {
                            throw new Error("Unhandled primitive case")
                        }
                    }
                }

                case "object": {
                    return ["symbol-object"]
                }    

                case "type_parameter": {
                    return ["symbol-type-parameter"]
                }

                case "string_mapping":
                case "template_literal":
                case "string_literal": {
                    return ["symbol-text"]
                }

                case "bigint_literal":
                case "number_literal": {
                    return ["symbol-number"]
                }

                case "enum": {
                    return ["symbol-enum"]
                }

                case "enum_literal": {
                    return ["symbol-enum-member"]
                }

                case "tuple":
                case "array": {
                    return ["symbol-array"]
                }

                case "intrinsic": {
                    return ["symbol-keyword"]
                }

                case "conditional": {
                    return ["question", "symbolIcon.keywordForeground"]
                }

                /* case "max_depth": {
                    return [ "ellipsis" ]
                } */

                case "substitution":
                case "non_primitive": {
                    return ["symbol-misc"]
                }

                case "union":
                case "intersection": {
                    return ["symbol-struct"]
                }

                case "signature":
                case "function": {
                    if(info.symbol?.insideClassOrInterface) {
                        return ["symbol-method"]
                    }

                    return ["symbol-function"]
                }

                case "interface": {
                    return ["symbol-interface"]
                }

                case "class": {
                    return ["symbol-class"]
                }

                case "index_info":
                case "indexed_access":
                case "index": {
                    return ["key", "symbolIcon.keyForeground"]
                }
            }

            return ["symbol-misc"]
        }
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