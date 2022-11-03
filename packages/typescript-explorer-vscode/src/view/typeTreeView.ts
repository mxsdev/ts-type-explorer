/* eslint-disable @typescript-eslint/require-await */

import {
    LocalizedTypeInfo,
    TypeInfoResolver,
    localizePurpose,
} from "@ts-type-explorer/api"
import assert = require("assert")
import * as vscode from "vscode"
import {
    showTypeParameterInfo,
    showBaseClassInfo,
    iconsEnabled,
    iconColorsEnabled,
    readonlyEnabled,
} from "../config"
import { markdownDocumentation } from "../markdown"
import { StateManager } from "../state/stateManager"
import {
    getQuickInfoAtLocation,
    getTypeTreeAtLocation,
    rangeFromLineAndCharacters,
} from "../util"

const {
    None: NoChildren,
    Expanded,
    Collapsed,
} = vscode.TreeItemCollapsibleState

export type TypeTreeChildrenUpdateInfo = {
    parent: TypeTreeItem | undefined
    children: TypeTreeItem[]
}

export class TypeTreeProvider implements vscode.TreeDataProvider<TypeTreeItem> {
    constructor(private stateManager: StateManager) {}

    private typeInfoResolver: TypeInfoResolver | undefined

    private _onDidChangeTreeData: vscode.EventEmitter<
        TypeTreeItem | undefined | null | void
    > = new vscode.EventEmitter()
    readonly onDidChangeTreeData: vscode.Event<
        TypeTreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event

    private _onDidGetChildren: vscode.EventEmitter<TypeTreeChildrenUpdateInfo> =
        new vscode.EventEmitter()
    readonly onDidGetChildren: vscode.Event<TypeTreeChildrenUpdateInfo> =
        this._onDidGetChildren.event

    refresh(): void {
        this.typeInfoResolver = undefined
        this._onDidChangeTreeData.fire()
    }

    async getTreeItem(element: TypeTreeItem) {
        if (element.typeInfo.locations) {
            for (const location of element.typeInfo.locations) {
                const { documentation, tags } =
                    (await getQuickInfoAtLocation(location)) ?? {}

                if (documentation && documentation.length > 0) {
                    element.tooltip = markdownDocumentation(
                        documentation,
                        tags ?? [],
                        vscode.Uri.file(location.fileName)
                    )
                    break
                }
            }
        }

        return element
    }

    async getChildren(element?: TypeTreeItem): Promise<TypeTreeItem[]> {
        const children = await this.getChildrenWorker(element)
        this._onDidGetChildren.fire({ parent: element, children })

        return children
    }

    private async getChildrenWorker(
        element?: TypeTreeItem
    ): Promise<TypeTreeItem[]> {
        if (!element) {
            const typeInfo = this.stateManager.getTypeTree()
            if (!typeInfo) {
                return []
            }

            this.typeInfoResolver = new TypeInfoResolver(getTypeTreeAtLocation)

            const localizedTypeInfo = await this.typeInfoResolver.localize(
                typeInfo
            )

            return [
                this.createTypeNode(localizedTypeInfo, /* root */ undefined),
            ]
        } else {
            if (
                !this.typeInfoResolver?.hasLocalizedTypeInfo(element.typeInfo)
            ) {
                return []
            }

            const localizedChildren =
                await this.typeInfoResolver.localizeChildren(element.typeInfo)

            return localizedChildren
                .map((info) => this.createTypeNode(info, element))
                .filter(
                    ({ typeInfo: { purpose } }) =>
                        showTypeParameterInfo.get() ||
                        !(
                            purpose === "type_argument_list" ||
                            purpose === "type_parameter_list"
                        )
                )
                .filter(
                    ({ typeInfo: { purpose } }) =>
                        showBaseClassInfo.get() ||
                        !(
                            purpose === "class_base_type" ||
                            purpose === "class_implementations" ||
                            purpose === "object_class"
                        )
                )
        }
    }

    createTypeNode(
        typeInfo: LocalizedTypeInfo,
        parent: TypeTreeItem | undefined
    ) {
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
        const depth = (parent?.depth ?? 0) + 1

        const { label, description, contextValue, icon, collapsibleState } =
            getMeta(typeInfo, depth)

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
        assert(
            this.typeInfo.locations && this.typeInfo.locations.length > 0,
            "Type has no locations!"
        )

        const location = this.typeInfo.locations[this.definitionIndex]
        this.definitionIndex =
            (this.definitionIndex + 1) % this.typeInfo.locations.length

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
}

type TypeTreeItemMeta = {
    label: string
    description?: string
    contextValue?: TypeTreeItemContextValue
    icon?: vscode.ThemeIcon
    collapsibleState: vscode.TreeItemCollapsibleState
}

function getMeta(info: LocalizedTypeInfo, depth: number): TypeTreeItemMeta {
    let nameOverridden = false

    const label = getLabel()
    const description = getDescription()

    const collapsibleState = getCollapsibleState()

    return {
        label,
        description,
        contextValue: getContextValue(),
        icon: getIcon(),
        collapsibleState,
    }

    function getCollapsibleState() {
        if ((info.children?.length ?? 0) === 0) {
            return NoChildren
        }

        if (info.purpose === "jsx_properties") {
            return Expanded
        }

        return depth === 1 ? Expanded : Collapsed
    }

    function getLabel() {
        const base = getLabelBase()

        if (!base) {
            return base
        }

        return addDecorations(base, {
            optional: info.optional,
            rest: info.rest,
        })

        function getLabelBase() {
            nameOverridden = true

            if (info.name !== undefined) {
                return info.name
            }

            if (info.purpose) {
                return `<${localizePurpose(info.purpose)}>`
            }

            nameOverridden = false
            return !info.symbol?.anonymous ? info.symbol?.name ?? "" : ""
        }
    }

    function getDescription() {
        if (!info.kindText) {
            return undefined
        }

        const decorate = (text: string) =>
            addDecorations(text, { dimension: info.dimension })

        const baseDescription = decorate(info.kindText)

        const aliasDescriptionBase =
            info.alias ??
            (nameOverridden &&
                info.purpose !== "jsx_properties" &&
                info.symbol?.name)
        const aliasDescription =
            aliasDescriptionBase && decorate(aliasDescriptionBase)

        let result = aliasDescription
            ? `${aliasDescription} (${baseDescription})`
            : baseDescription

        if (info.readonly && readonlyEnabled.get()) {
            result = "readonly " + result
        }

        return result
    }

    function getContextValue(): TypeTreeItemContextValue | undefined {
        return info.locations && info.locations.length > 0
            ? "declared"
            : undefined
    }

    type IconId = [id: string, colorId?: string]

    function getIcon(): vscode.ThemeIcon | undefined {
        if (!iconsEnabled.get()) {
            return undefined
        }

        const iconIds = _getIcon()
        if (!iconIds) {
            return undefined
        }

        const [id] = iconIds
        let [colorId] = iconIds

        if (!iconColorsEnabled.get()) {
            colorId = "icon.foreground"
        }

        return !colorId
            ? new vscode.ThemeIcon(id)
            : new vscode.ThemeIcon(id, new vscode.ThemeColor(colorId))

        function _getIcon(): IconId | undefined {
            if (info.symbol?.property) {
                return ["symbol-field"]
            }

            if (info.symbol?.isArgument) {
                return ["symbol-property"]
            }

            switch (info.purpose) {
                case "class_constructor": {
                    return ["symbol-constructor"]
                }
            }

            switch (info.kind) {
                case "primitive": {
                    switch (info.primitiveKind) {
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

                case "boolean_literal": {
                    return ["symbol-boolean"]
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
                    if (info.symbol?.insideClassOrInterface) {
                        return ["symbol-method"]
                    }

                    return ["symbol-function"]
                }

                case "interface": {
                    return ["symbol-interface"]
                }

                case "namespace": {
                    return ["symbol-namespace"]
                }

                case "module": {
                    return ["symbol-module"]
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

function addDecorations(
    text: string,
    decorations: { rest?: boolean; optional?: boolean; dimension?: number }
) {
    const { rest = false, optional = false, dimension = 0 } = decorations

    text += "[]".repeat(dimension)

    if (optional) {
        text += "?"
    }

    if (rest) {
        text = "..." + text
    }

    return text
}
