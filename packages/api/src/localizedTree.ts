import { getKindText, getPrimitiveKindText } from "./localization"
import {
    IndexInfo,
    LocalizableKind,
    LocalizeData,
    LocalizedSymbolInfo,
    LocalizedTypeInfo,
    LocalizeOpts,
    ResolvedArrayTypeInfo,
    ResolvedTypeInfo,
    SignatureInfo,
    SourceFileLocation,
    SymbolInfo,
    TypeInfo,
    TypeInfoChildren,
    TypeInfoKind,
} from "./types"
import { getEmptyTypeId, pseudoBigIntToString } from "./util"
import { SymbolFlags } from "./typescript"
import { wrapSafe, isEmpty, isNonEmpty } from "./objectUtil"

// TODO: optional param booleans can sometimes become undefined|true|false (should just be boolean)

export function _localizeTypeInfo(
    info: TypeInfo,
    resolved: ResolvedArrayTypeInfo,
    data: LocalizeData,
    opts: LocalizeOpts = {}
): LocalizedTypeInfo {
    const { localizedOrigin } = data
    const { purpose, optional, name, includeIds } = opts

    const symbol = wrapSafe(localizeSymbol)(info.symbolMeta)

    info = resolved.info
    const dimension = resolved.dimension

    const isOptional =
        info.symbolMeta?.optional ||
        optional ||
        (info.symbolMeta?.flags ?? 0) & SymbolFlags.Optional
    const isRest = info.symbolMeta?.rest

    const locations = getTypeLocations(info)

    const res: LocalizedTypeInfo = {
        kindText: getKind(info),
        kind: info.kind,
        ...(info.kind === "primitive" && { primitiveKind: info.primitive }),
        alias: getAlias(info),
        symbol,
        purpose,
        ...(isOptional && { optional: true }),
        ...(isRest && { rest: true }),
        ...(dimension && { dimension }),
        ...(name !== undefined && { name }),
        locations,
    }

    res.children = getChildren(info, opts)
    localizedOrigin.set(res, info)

    if (includeIds) {
        res._id = info.id
    }

    return res
}

function getChildren(
    info: ResolvedTypeInfo,
    { typeArguments: contextualTypeArguments, typeArgument }: LocalizeOpts = {}
): TypeInfoChildren | undefined {
    const localizeOpts = (info: TypeInfo, opts?: LocalizeOpts) => ({
        info,
        opts,
    })
    const localize = (info: TypeInfo) => localizeOpts(info)
    const createChild = (localizedInfo: LocalizedTypeInfo) => ({
        localizedInfo,
    })

    const typeParameters = info.typeParameters
    const typeArguments = info.typeArguments ?? contextualTypeArguments

    let passTypeArguments: TypeInfo[] | undefined
    let parameterChildren: TypeInfoChildren | undefined

    if (info.kind === "function") {
        passTypeArguments = typeArguments
    } else if (info.kind === "object" && info.objectClass) {
        passTypeArguments = typeArguments
        parameterChildren = getTypeParameterAndArgumentList(
            typeParameters,
            undefined
        )
    } else {
        parameterChildren = getTypeParameterAndArgumentList(
            typeParameters,
            typeArguments
        )
    }

    const baseChildren = getBaseChildren(passTypeArguments)

    const children = [...(parameterChildren ?? []), ...(baseChildren ?? [])]

    return !isEmpty(children) ? children : undefined

    function getBaseChildren(
        typeArguments?: TypeInfo[]
    ): TypeInfoChildren | undefined {
        switch (info.kind) {
            case "object": {
                const { properties, indexInfos = [], objectClass } = info
                return [
                    ...(objectClass
                        ? [
                              localizeOpts(objectClass, {
                                  purpose: "object_class",
                                  typeArguments,
                              }),
                          ]
                        : []),
                    ...indexInfos.map((info) => getLocalizedIndex(info)),
                    ...properties.map(localize),
                ]
            }

            case "class":
            case "interface": {
                const {
                    properties,
                    baseType,
                    implementsTypes,
                    constructSignatures,
                    indexInfos,
                } = info
                return [
                    ...(baseType
                        ? [
                              localizeOpts(baseType, {
                                  purpose: "class_base_type",
                              }),
                          ]
                        : []),
                    ...(isNonEmpty(implementsTypes)
                        ? [
                              createChild({
                                  purpose: "class_implementations",
                                  children: implementsTypes.map(localize),
                              }),
                          ]
                        : []),
                    ...(isNonEmpty(constructSignatures)
                        ? [
                              localizeOpts(
                                  {
                                      kind: "function",
                                      id: getEmptyTypeId(),
                                      signatures: constructSignatures,
                                  },
                                  { purpose: "class_constructor" }
                              ),
                          ]
                        : []),
                    ...(indexInfos?.map((info) => getLocalizedIndex(info)) ??
                        []),
                    ...properties.map(localize),
                ]
            }

            case "enum": {
                const { properties = [] } = info
                return properties.map(localize)
            }

            case "function": {
                const { signatures, isJSXElement } = info

                if (signatures.length === 1) {
                    return getLocalizedSignatureChildren(
                        signatures[0],
                        isJSXElement,
                        typeArguments
                    )
                } else {
                    return signatures.map((sig) =>
                        getLocalizedSignature(sig, isJSXElement, typeParameters)
                    )
                }
            }

            case "array": {
                throw new Error("Tried to get children for array type")
            }

            case "tuple": {
                const { types, names } = info
                return types.map((t, i) =>
                    localizeOpts(t, { name: names?.[i] })
                )
            }

            case "conditional": {
                const { checkType, extendsType, trueType, falseType } = info

                return [
                    localizeOpts(checkType, { purpose: "conditional_check" }),
                    localizeOpts(extendsType, {
                        purpose: "conditional_extends",
                    }),
                    ...(trueType
                        ? [
                              localizeOpts(trueType, {
                                  purpose: "conditional_true",
                              }),
                          ]
                        : []),
                    ...(falseType
                        ? [
                              localizeOpts(falseType, {
                                  purpose: "conditional_false",
                              }),
                          ]
                        : []),
                ]
            }

            case "index": {
                const { keyOf } = info

                return [localizeOpts(keyOf, { purpose: "keyof" })]
            }

            case "indexed_access": {
                const { indexType, objectType } = info

                return [
                    localizeOpts(objectType, {
                        purpose: "indexed_access_base",
                    }),
                    localizeOpts(indexType, {
                        purpose: "indexed_access_index",
                    }),
                ]
            }

            // TODO: intersection properties
            case "intersection": {
                const { types, properties, indexInfos = [] } = info

                return [
                    ...indexInfos.map((info) => getLocalizedIndex(info)),
                    ...properties.map(localize),
                    ...types.map(localize),
                ]
            }

            case "union": {
                const { types } = info
                return types.map(localize)
            }

            case "string_mapping": {
                const { type } = info
                return [localize(type)]
            }

            case "template_literal": {
                const { types, texts } = info
                const res: TypeInfoChildren = []

                let i = 0,
                    j = 0

                while (i < texts.length || j < types.length) {
                    if (i < texts.length) {
                        const text = texts[i]
                        if (text) {
                            res.push(
                                localize({
                                    kind: "string_literal",
                                    id: getEmptyTypeId(),
                                    value: text,
                                })
                            )
                        }
                        i++
                    }

                    if (j < types.length) {
                        const type = types[j]
                        res.push(localize(type))
                        j++
                    }
                }

                return res
            }

            case "type_parameter": {
                return getLocalizedTypeParameter(info, typeArgument)
            }

            default: {
                return undefined
            }
        }
    }

    function getTypeParameterAndArgumentList(
        typeParameters: TypeInfo[] | undefined,
        typeArguments: TypeInfo[] | undefined
    ): TypeInfoChildren {
        if (typeParameters && typeArguments) {
            return [getTypeParameterList(typeParameters, typeArguments)]
        } else {
            return [
                ...(typeParameters
                    ? [getTypeParameterList(typeParameters)]
                    : []),
                ...(typeArguments ? [getTypeArgumentList(typeArguments)] : []),
            ]
        }
    }

    function getLocalizedTypeParameter(
        info: TypeInfoKind<"type_parameter">,
        value?: TypeInfo
    ): TypeInfoChildren {
        const { defaultType, baseConstraint } = info
        return [
            ...(value
                ? [localizeOpts(value, { purpose: "parameter_value" })]
                : []),
            ...(defaultType
                ? [localizeOpts(defaultType, { purpose: "parameter_default" })]
                : []),
            ...(baseConstraint
                ? [
                      localizeOpts(baseConstraint, {
                          purpose: "parameter_base_constraint",
                      }),
                  ]
                : []),
        ]
    }

    function getTypeArgumentList(info: TypeInfo[]) {
        return createChild({
            purpose: "type_argument_list",
            children: info.map(localize),
        })
    }

    function getTypeParameterList(
        typeParameters: TypeInfo[],
        typeArguments?: TypeInfo[]
    ) {
        return createChild({
            purpose: "type_parameter_list",
            children: typeParameters.map((param, i) =>
                localizeOpts(param, { typeArgument: typeArguments?.[i] })
            ),
        })
    }

    function getLocalizedIndex(indexInfo: IndexInfo) {
        const indexSymbol = wrapSafe(localizeSymbol)(indexInfo.parameterSymbol)

        return createChild({
            kindText: "index",
            kind: "index_info",
            symbol: indexSymbol,
            locations: indexSymbol?.locations,
            children: [
                ...(indexInfo.parameterType
                    ? [
                          localizeOpts(indexInfo.parameterType, {
                              purpose: "index_parameter_type",
                          }),
                      ]
                    : []),
                ...(indexInfo.keyType
                    ? [
                          localizeOpts(indexInfo.keyType, {
                              purpose: "index_type",
                          }),
                      ]
                    : []),
                ...(indexInfo.type
                    ? [
                          localizeOpts(indexInfo.type, {
                              purpose: "index_value_type",
                          }),
                      ]
                    : []),
            ],
        })
    }

    function getLocalizedSignature(
        signature: SignatureInfo,
        isInsideJSXElement: boolean | undefined,
        typeArguments?: TypeInfo[]
    ) {
        const symbol = wrapSafe(localizeSymbol)(signature.symbolMeta)

        return createChild({
            kindText: !isInsideJSXElement ? "signature" : "definition",
            kind: "signature",
            symbol,
            locations: symbol?.locations,
            children: getLocalizedSignatureChildren(
                signature,
                isInsideJSXElement,
                typeArguments
            ),
        })
    }

    function getLocalizedSignatureChildren(
        signature: SignatureInfo,
        isInsideJSXElement: boolean | undefined,
        typeArguments?: TypeInfo[]
    ) {
        return [
            ...getTypeParameterAndArgumentList(
                signature.typeParameters,
                typeArguments
            ),
            ...signature.parameters.map((p, i) =>
                localizeOpts(
                    p,
                    i === 0 && isInsideJSXElement
                        ? { purpose: "jsx_properties" }
                        : undefined
                )
            ),
            ...(signature.returnType
                ? [localizeOpts(signature.returnType, { purpose: "return" })]
                : []),
        ]
    }
}

function localizeSymbol(symbolInfo: SymbolInfo): LocalizedSymbolInfo {
    const locations = getLocations(symbolInfo)

    const property = symbolInfo.flags & SymbolFlags.Property
    const isArgument = symbolInfo.flags & SymbolFlags.FunctionScopedVariable

    return {
        name: symbolInfo.name,
        ...(symbolInfo.anonymous && { anonymous: symbolInfo.anonymous }),
        ...(symbolInfo.insideClassOrInterface && {
            insideClassOrInterface: symbolInfo.insideClassOrInterface,
        }),
        ...(property && { property: true }),
        ...(isArgument && { isArgument: true }),
        locations,
    }
}

function getAlias(info: ResolvedTypeInfo): string | undefined {
    const defaultValue = info.aliasSymbolMeta?.name

    switch (info.kind) {
        case "type_parameter": {
            return defaultValue ?? info.typeSymbolMeta?.name
        }

        case "class": {
            return defaultValue ?? info.classSymbol?.name
        }

        case "bigint_literal":
        case "number_literal":
        case "string_literal":
        case "boolean_literal": {
            return undefined
        }

        case "enum_literal": {
            let text = info.literalSymbol.name
            if (info.parentSymbol) {
                text = `${info.parentSymbol.name}.${text}`
            }
            return text
        }

        default: {
            return defaultValue
        }
    }
}

function getKind(info: ResolvedTypeInfo): string {
    const kindText = (kind: LocalizableKind, ...args: string[]) =>
        getKindText(
            kind,
            {
                insideClassOrInterface: info.symbolMeta?.insideClassOrInterface,
                isJSXElement: info.kind === "function" && info.isJSXElement,
            },
            ...args
        )

    switch (info.kind) {
        case "string_mapping": {
            const { typeSymbol } = info
            return typeSymbol.name
        }

        case "primitive": {
            return getPrimitiveKindText(info.primitive)
        }

        case "bigint_literal": {
            return kindText(info.kind, pseudoBigIntToString(info.value))
        }

        case "boolean_literal": {
            return kindText(info.kind, info.value.toString())
        }

        case "string_literal": {
            return kindText(info.kind, info.value)
        }

        case "number_literal": {
            return kindText(info.kind, info.value.toString())
        }

        default: {
            return kindText(info.kind)
        }
    }
}

function getTypeLocations(info: TypeInfo): SourceFileLocation[] | undefined {
    const baseLocations = wrapSafe(getLocations)(
        info.aliasSymbolMeta ?? info.symbolMeta
    )

    if (!baseLocations) {
        if (info.kind === "function" && info.signatures.length === 1) {
            return wrapSafe(getLocations)(info.signatures[0].symbolMeta)
        }
    }

    return baseLocations
}

function getLocations(info: SymbolInfo): SourceFileLocation[] | undefined {
    return info.declarations?.map(({ location }) => location)
}
