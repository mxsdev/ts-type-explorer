import * as assert from "assert"
import {
    getKindText,
    getPrimitiveKindText,
    LocalizableKind,
} from "./localization"
import {
    IndexInfo,
    SignatureInfo,
    SourceFileLocation,
    SymbolInfo,
    TypeId,
    TypeInfo,
    TypeInfoKind,
} from "./types"
import { getTypeInfoChildren } from "./tree"
import {
    filterUndefined,
    getEmptyTypeId,
    isEmpty,
    isNonEmpty,
    pseudoBigIntToString,
    wrapSafe,
} from "./util"
import { SymbolFlags } from "./typescript"

// TODO: optional param booleans can sometimes become undefined|true|false (should just be boolean)
// TODO: enum value aliases sometimes aren't working (like in SymbolFlags up above)

type TypeInfoRetriever = (
    location: SourceFileLocation
) => Promise<TypeInfo | undefined>

export class TypeInfoLocalizer {
    private includeIds = false

    typeInfoMaps = new WeakMap<TypeInfo, TypeInfoMap>()
    localizedInfoOrigin = new WeakMap<LocalizedTypeInfo, TypeInfo>()

    constructor(private retrieveTypeInfo?: TypeInfoRetriever) {}

    hasTypeInfo(info: TypeInfo): boolean {
        return this.typeInfoMaps.has(info)
    }

    hasLocalizedTypeInfo(localizedInfo: LocalizedTypeInfo): boolean {
        const info = this.localizedInfoOrigin.get(localizedInfo)
        return !!(info && this.hasTypeInfo(info))
    }

    private localizeTypeInfo(
        resolvedInfo: ResolvedArrayTypeInfo,
        info?: TypeInfo,
        opts?: LocalizeOpts
    ) {
        info ??= resolvedInfo.info

        opts ??= {}
        opts.includeIds = this.includeIds

        return _localizeTypeInfo(
            info,
            resolvedInfo,
            { localizedOrigin: this.localizedInfoOrigin },
            opts
        )
    }

    async localize(info: TypeInfo) {
        return this.localizeTypeInfo(
            await this.resolveTypeReferenceOrArray(info)
        )
    }

    getTypeInfoMap(info: TypeInfo) {
        if (this.typeInfoMaps.has(info)) {
            return this.typeInfoMaps.get(info)!
        }

        const typeInfoMap = generateTypeInfoMap(info)
        this.typeInfoMaps.set(info, typeInfoMap)

        return typeInfoMap
    }

    async localizeChildren(
        parent: LocalizedTypeInfo
    ): Promise<LocalizedTypeInfo[]> {
        const parentOrigin = this.localizedInfoOrigin.get(parent)
        assert(parentOrigin)

        return await Promise.all(
            parent.children?.map(async ({ info, localizedInfo, opts }) => {
                assert(
                    info || localizedInfo,
                    "Either info or localized info must be provided"
                )

                if (localizedInfo) {
                    this.localizedInfoOrigin.set(localizedInfo, parentOrigin)
                    return localizedInfo
                }

                assert(info)

                const typeInfoMap = this.getTypeInfoMap(parentOrigin)

                const resolvedInfo = await this.resolveTypeReferenceOrArray(
                    info,
                    typeInfoMap
                )

                return this.localizeTypeInfo(resolvedInfo, info, opts)
            }) ?? []
        ).then(filterUndefined)
    }

    private async resolveTypeReferenceOrArray(
        info: TypeInfo,
        _typeInfoMap?: TypeInfoMap
    ): Promise<ResolvedArrayTypeInfo> {
        let dimension = 0
        let resolvedInfo = info

        let typeInfoMap = _typeInfoMap ?? this.getTypeInfoMap(info)

        while (
            resolvedInfo.kind === "array" ||
            resolvedInfo.kind === "reference"
        ) {
            if (resolvedInfo.kind === "array") {
                dimension++
                resolvedInfo = resolvedInfo.type
            } else {
                const resolved = await this.resolveTypeReference(
                    resolvedInfo,
                    typeInfoMap
                )

                assert(resolved, "Cannot resolve type from location!")

                typeInfoMap = resolved.typeInfoMap
                resolvedInfo = resolved.typeInfo
            }
        }

        resolvedInfo = {
            ...resolvedInfo,
            symbolMeta: info.symbolMeta,
            id: info.id,
        }

        if (dimension === 0) {
            resolvedInfo.aliasSymbolMeta = info.aliasSymbolMeta
        }

        this.typeInfoMaps.set(resolvedInfo, typeInfoMap)

        return { info: resolvedInfo, dimension }
    }

    private async resolveTypeReference(
        typeInfo: TypeInfo,
        typeInfoMap: TypeInfoMap
    ): Promise<
        { typeInfo: ResolvedTypeInfo; typeInfoMap: TypeInfoMap } | undefined
    > {
        if (typeInfo.kind === "reference") {
            if (typeInfo.location) {
                assert(this.retrieveTypeInfo, "Must provide retriveTypeInfo")

                const retrievedTypeInfo = (await this.retrieveTypeInfo(
                    typeInfo.location
                )) as ResolvedTypeInfo

                if (!retrievedTypeInfo) return undefined

                typeInfoMap = this.getTypeInfoMap(retrievedTypeInfo)
                typeInfo = retrievedTypeInfo
            } else {
                const resolvedTypeInfo = typeInfoMap.get(typeInfo.id)
                assert(resolvedTypeInfo, "Encountered invalid type reference!")

                typeInfo = resolvedTypeInfo
            }
        }

        this.typeInfoMaps.set(typeInfo, typeInfoMap)
        return { typeInfo, typeInfoMap }
    }

    /**
     * Sets localizer to debug mode, which will include id information in
     * resultant localized type info.
     *
     * This is used by the test runner to identify circular paths.
     */
    debug(): this {
        this.includeIds = true
        return this
    }
}

function generateTypeInfoMap(tree: TypeInfo, cache?: TypeInfoMap): TypeInfoMap {
    cache ??= new Map()

    if (tree.kind === "reference") {
        return cache
    }
    cache.set(tree.id, tree)
    getTypeInfoChildren(tree).forEach((c) => generateTypeInfoMap(c, cache))

    return cache
}

export type TypePurpose =
    | "return"
    | "index_type"
    | "index_value_type"
    | "index_parameter_type"
    | "conditional_check"
    | "conditional_extends"
    | "conditional_true"
    | "conditional_false"
    | "keyof"
    | "indexed_access_index"
    | "indexed_access_base"
    | "parameter_default"
    | "parameter_base_constraint"
    | "class_constructor"
    | "class_base_type"
    | "class_implementations"
    | "object_class"
    | "type_parameter_list"
    | "type_argument_list"
    | "parameter_value"

type ResolvedTypeInfo = Exclude<TypeInfo, { kind: "reference" }>
type LocalizedSymbolInfo = {
    name: string
    anonymous?: boolean
    insideClassOrInterface?: boolean
    property?: boolean
    locations?: SourceFileLocation[]
    isArgument?: boolean
}

type TypeInfoChildren = {
    info?: TypeInfo
    localizedInfo?: LocalizedTypeInfo
    opts?: LocalizeOpts
}[]

type ResolvedArrayTypeInfo = {
    info: Exclude<ResolvedTypeInfo, { kind: "array" }>
    dimension: number
}

export type LocalizedTypeInfo = {
    kindText?: string
    kind?: ResolvedTypeInfo["kind"] | "signature" | "index_info"
    primitiveKind?: TypeInfoKind<"primitive">["primitive"]
    alias?: string
    symbol?: LocalizedSymbolInfo
    name?: string
    purpose?: TypePurpose
    optional?: boolean
    dimension?: number
    rest?: boolean
    children?: TypeInfoChildren
    locations?: SourceFileLocation[]
    /**
     * Debug id information, used by test runner
     * to identify and remove cycles
     */
    _id?: TypeId
}

export type TypeInfoMap = Map<TypeId, ResolvedTypeInfo>

type LocalizeOpts = {
    optional?: boolean
    purpose?: TypePurpose
    name?: string
    typeArguments?: TypeInfo[]
    typeArgument?: TypeInfo
    includeIds?: boolean
}
type LocalizeData = {
    localizedOrigin: WeakMap<LocalizedTypeInfo, TypeInfo>
}

function _localizeTypeInfo(
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
    }) //_localizeTypeInfo(info, data, opts)
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
                const { signatures } = info

                if (signatures.length === 1) {
                    return getLocalizedSignatureChildren(
                        signatures[0],
                        typeArguments
                    )
                } else {
                    return signatures.map((sig) =>
                        getLocalizedSignature(sig, typeParameters)
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
            case "intersection":
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
        return createChild({
            kindText: "index",
            kind: "index_info",
            symbol: wrapSafe(localizeSymbol)(indexInfo.parameterSymbol),
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
        typeArguments?: TypeInfo[]
    ) {
        const symbol = wrapSafe(localizeSymbol)(signature.symbolMeta)

        return createChild({
            kindText: "signature",
            kind: "signature",
            symbol,
            locations: symbol?.locations,
            children: getLocalizedSignatureChildren(signature, typeArguments),
        })
    }

    function getLocalizedSignatureChildren(
        signature: SignatureInfo,
        typeArguments?: TypeInfo[]
    ) {
        return [
            ...getTypeParameterAndArgumentList(
                signature.typeParameters,
                typeArguments
            ),
            ...signature.parameters.map(localize),
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
            { insideClassOrInterface: info.symbolMeta?.insideClassOrInterface },
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
