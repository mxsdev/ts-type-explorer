import {
    LocalizedTypeInfo,
    LocalizedTypeInfoOrError,
    localizePurpose,
    LocalizedTypeInfoError,
} from "./"
import * as vscode from "vscode"
import { ExtensionConfig, ExtensionMarkdown, ExtensionTreeCollapsibleState, ExtensionTreeItemContextValue, ExtensionTreeItemMeta, ExtensionTreeSymbol, TypeInfo } from "./types"

const NoChildren: ExtensionTreeCollapsibleState = 'none'
const Expanded: ExtensionTreeCollapsibleState = 'expanded'
const Collapsed: ExtensionTreeCollapsibleState = 'collapsed'

export function getMeta(
    info: LocalizedTypeInfoOrError,
    depth: number,
    extensionConfig: Partial<ExtensionConfig> = { },
    logError?: (msg: string, error: Error, typeInfo: TypeInfo | undefined) => void,
): ExtensionTreeItemMeta {
    if (info.error) {
        return getErrorMeta(info.error)
    }

    const {
      iconColorsEnabled = true,
      iconsEnabled = true,
      readonlyEnabled = false,
    } = extensionConfig

    const label = getLabel(info)
    const description = getDescription(info, readonlyEnabled)

    const collapsibleState = getCollapsibleState()

    return {
        label,
        description,
        contextValue: getContextValue(),
        symbol: getIcon(),
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

    function getContextValue(): ExtensionTreeItemContextValue | undefined {
        return info.locations && info.locations.length > 0
            ? "declared"
            : undefined
    }

    // type IconId = [id: string, colorId?: string]

    function getIcon(): ExtensionTreeSymbol | undefined {
        if (!iconsEnabled) {
            return undefined
        }

        return _getIcon()

        // const [id] = iconIds
        // let [colorId] = iconIds

        // if (!iconColorsEnabled) {
        //     colorId = "icon.foreground"
        // }

        // return !colorId
        //     ? new vscode.ThemeIcon(id)
        //     : new vscode.ThemeIcon(id, new vscode.ThemeColor(colorId))

        function _getIcon(): ExtensionTreeSymbol | undefined {
            if (info.error) {
                // return ["error", "errorForeground"]
                return 'error'
            }

            if (info.symbol?.property) {
                // return ["symbol-field"]
                return 'field'
            }

            if (info.symbol?.isArgument) {
                // return ["symbol-property"]
                return 'property'
            }

            switch (info.purpose) {
                case "class_constructor": {
                    // return ["symbol-constructor"]
                    return 'constructor'
                }
            }

            switch (info.kind) {
                case "primitive": {
                    switch (info.primitiveKind) {
                        case "essymbol":
                        case "unique_symbol":
                        case "string": {
                            // return ["symbol-string"]
                            return 'string'
                        }

                        case "bigint":
                        case "number": {
                            // return ["symbol-numeric"]
                            return 'numeric'
                        }

                        case "boolean": {
                            // return ["symbol-boolean"]
                            return 'boolean'
                        }

                        case "unknown":
                        case "any":
                        case "void":
                        case "undefined":
                        case "null": {
                            // return ["symbol-null"]
                            return 'null'
                        }

                        case "never": {
                            // return ["error", "symbolIcon.nullForeground"]
                            return 'never'
                        }

                        default: {
                            throw new Error("Unhandled primitive case")
                        }
                    }
                }

                case "object": {
                    // return ["symbol-object"]
                    return 'object'
                }

                case "type_parameter": {
                    // return ["symbol-type-parameter"]
                    return 'type-parameter'
                }

                case "string_mapping":
                case "template_literal":
                case "string_literal": {
                    // return ["symbol-text"]
                    return 'text'
                }

                case "bigint_literal":
                case "number_literal": {
                    // return ["symbol-number"]
                    return 'number'
                }

                case "boolean_literal": {
                    // return ["symbol-boolean"]
                    return 'boolean'
                }

                case "enum": {
                    // return ["symbol-enum"]
                    return 'enum'
                }

                case "enum_literal": {
                    // return ["symbol-enum-member"]
                    return 'enum-member'
                }

                case "tuple":
                case "array": {
                    // return ["symbol-array"]
                    return 'array'
                }

                case "intrinsic": {
                    // return ["symbol-keyword"]
                    return 'keyword'
                }

                case "conditional": {
                    // return ["question", "symbolIcon.keywordForeground"]
                    return 'condition'
                }

                /* case "max_depth": {
                    return [ "ellipsis" ]
                } */

                case "substitution":
                case "non_primitive": {
                    // return ["symbol-misc"]
                    return 'misc'
                }

                case "union": {
                    return 'union'
                }

                case "intersection": {
                    // return ["symbol-struct"]
                    return 'intersection'
                }

                case "signature":
                case "function": {
                    if (info.symbol?.insideClassOrInterface) {
                        // return ["symbol-method"]
                        return 'method'
                    }

                    // return ["symbol-function"]
                    return 'function'
                }

                case "interface": {
                    // return ["symbol-interface"]
                    return 'interface'
                }

                case "namespace": {
                    // return ["symbol-namespace"]
                    return 'namespace'
                }

                case "module": {
                    // return ["symbol-module"]
                    return 'module'
                }

                case "class": {
                    // return ["symbol-class"]
                    return 'class'
                }

                case "index_info":
                case "indexed_access":
                case "index": {
                    // return ["key", "symbolIcon.keyForeground"]
                    return 'index'
                }
            }

            // return ["symbol-misc"]
            return 'misc'
        }
    }

    function getErrorMeta({
        error,
        typeInfo,
    }: LocalizedTypeInfoError): ExtensionTreeItemMeta {
        return {
            description: "<error>",
            label: typeInfo?.symbolMeta?.name ?? "",
            collapsibleState: NoChildren,
            symbol: getIcon(),
            tooltip: getTooltip(),
            contextValue: getContextValue(),
        }

        function getTooltip(): ExtensionMarkdown {
            // const tooltip = new vscode.MarkdownString()
            const tooltip: ExtensionMarkdown = []

            // tooltip.appendText(`Error getting type info`)
            // tooltip.appendCodeblock(`${error.name}: ${error.message}`)

            tooltip.push({ type: 'text', content: "Error getting type info" })
            tooltip.push({ type: 'codeblock', content: `${error.name}: ${error.message}` })

            if (error.stack) {
                // tooltip.appendMarkdown(`# Stack`)
                // tooltip.appendCodeblock(error.stack)

                tooltip.push({ type: 'markdown', content: "# Stack" })
                tooltip.push({ type: 'codeblock', content: error.stack })
            }

            if (typeInfo) {
                // tooltip.appendMarkdown(`Type Tree`)
                // tooltip.appendCodeblock(
                //     JSON.stringify(typeInfo, undefined, 4),
                //     "json"
                // )

                tooltip.push({ type: 'markdown', content: "Type Tree"})
                tooltip.push({ type: 'codeblock', content: JSON.stringify(typeInfo, undefined, 4), lang: "json" })
            }

            logError?.("Error getting type info", error, typeInfo)

            return tooltip
        }

        function getContextValue() {
            if (!typeInfo?.symbolMeta?.declarations) return undefined

            if (typeInfo.symbolMeta.declarations.length > 0) {
                return "declared"
            }

            return undefined
        }
    }
}

type DescriptionParts = {
    alias?: string
    base?: string
    readonly?: boolean
}

function getDescription(info: LocalizedTypeInfo, readonlyEnabled: boolean) {
    return descriptionPartsToString(getDescriptionParts(info, readonlyEnabled))
}

export function getMetaWithTypeArguments(
    info: LocalizedTypeInfo,
    resolvedTypeArguments: LocalizedTypeInfo[],
    extensionConfig?: Partial<ExtensionConfig>
):
    | {
        label?: string
        description?: string
      }
    | undefined {
    const {
      descriptionTypeArgumentsEnabled = true,
      descriptionTypeArgumentsMaxLength = 10,
      metaTypeArgumentsInFunction = false,
      readonlyEnabled = false,
    } = extensionConfig ?? { }
      
    const parts = getDescriptionParts(info, readonlyEnabled)

    if (descriptionTypeArgumentsEnabled) {
        const args: string[] = []

        for (const arg of resolvedTypeArguments) {
            const { base, alias } = getDescriptionParts(arg, readonlyEnabled)

            let baseText = alias ?? base ?? "???"

            if (alias && arg.typeArguments && arg.typeArguments.length > 0) {
                baseText += "<...>"
            }

            args.push(baseText)
        }

        let argsText = args.join(", ")

        if (argsText.length > (descriptionTypeArgumentsMaxLength ?? 10)) {
            argsText = `...`
        }

        const typeArgumentText = `<${argsText}>`

        if (info.kind === "function" && metaTypeArgumentsInFunction) {
            return {
                label: getLabel(info) + typeArgumentText,
            }
        } else {
            if (parts.alias) {
                parts.alias += typeArgumentText

                return {
                    description: descriptionPartsToString(parts),
                }
            }
        }
    }

    return undefined
}

function getDescriptionParts(info: LocalizedTypeInfo, readonlyEnabled: boolean): DescriptionParts {
    if (!info.kindText) {
        return {}
    }

    const decorate = (text: string) =>
        addDecorations(text, { dimension: info.dimension })

    const baseDescription = decorate(info.kindText)

    const nameOverridden = !!getLabelOverride(info)

    const aliasDescriptionBase =
        info.alias ??
        (nameOverridden && info.purpose !== "jsx_properties"
            ? info.symbol?.name
            : undefined)

    const aliasDescription =
        aliasDescriptionBase && decorate(aliasDescriptionBase)

    return {
        alias: aliasDescription,
        base: baseDescription,
        readonly: info.readonly && readonlyEnabled,
    }
}

function descriptionPartsToString({
    alias,
    base,
    readonly,
}: DescriptionParts): string | undefined {
    if (!base) {
        return undefined
    }

    let result = alias ? `${alias} (${base})` : base

    if (readonly) {
        result = "readonly " + result
    }

    return result
}

function getLabel(info: LocalizedTypeInfo) {
    const base = getLabelBase(info)

    if (!base) {
        return base
    }

    return addDecorations(base, {
        optional: info.optional,
        rest: info.rest,
    })
}

function getLabelBase(info: LocalizedTypeInfo) {
    return (
        getLabelOverride(info) ??
        (!info.symbol?.anonymous ? info.symbol?.name ?? "" : "")
    )
}

function getLabelOverride(info: LocalizedTypeInfo) {
    return getLabelByName(info) ?? getLabelByPurpose(info)
}

function getLabelByName(info: LocalizedTypeInfo) {
    if (info.name !== undefined) {
        return info.name
    }

    return undefined
}

function getLabelByPurpose(info: LocalizedTypeInfo) {
    if (info.purpose) {
        return `<${localizePurpose(info.purpose)}>`
    }

    return undefined
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

