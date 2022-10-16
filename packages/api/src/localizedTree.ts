import assert from "assert"
import * as ts from "typescript"
import { getKindText, getPrimitiveKindText, LocalizableKind } from "./localization"
import { IndexInfo, SignatureInfo, SymbolInfo, TypeId, TypeInfo, TypeInfoKind } from "./types"
import { getTypeInfoChildren } from "./tree"
import { getEmptyTypeId, isEmpty, isNonEmpty, pseudoBigIntToString, wrapSafe } from "./util"

export function localizeTypeInfo(info: TypeInfo, typeInfoMap: TypeInfoMap): LocalizedTypeInfo {
    return _localizeTypeInfo(info, { typeInfoMap })
}

export function getLocalizedTypeInfoChildren(info: LocalizedTypeInfo, typeInfoMap: TypeInfoMap): LocalizedTypeInfo[] {
    return info.children?.map(
        ({info, localizedInfo, opts}) => {
            assert(info || localizedInfo, "Either info or localized info must be provided")

            if(localizedInfo) {
                return localizedInfo
            }

            return _localizeTypeInfo(info!, { typeInfoMap }, opts)
        }
    ) ?? []
}

type TypePurpose = 'return'|'index_type'|'index_value_type'|'conditional_check'|'conditional_extends'|'conditional_true'|'conditional_false'|'keyof'|'indexed_access_index'|'indexed_access_base'|'parameter_default'|'parameter_base_constraint'|'class_constructor'|'class_base_type'|'class_implementations'|'object_class'|'type_parameter_list'|'type_argument_list'|'parameter_value'

type ResolvedTypeInfo = Exclude<TypeInfo, {kind: 'reference'}>
type LocalizedSymbolInfo = { name: string, anonymous?: boolean }

type TypeInfoChildren = ({ info?: TypeInfo, localizedInfo?: LocalizedTypeInfo, opts?: LocalizeOpts })[]

export type LocalizedTypeInfo = {
    kindText?: string,
    kind?: ResolvedTypeInfo['kind'],
    alias?: string,
    symbol?: LocalizedSymbolInfo,
    name?: string,
    purpose?: string,
    optional?: boolean,
    dimension?: number,
    rest?: boolean,
    children?: TypeInfoChildren,
}

export type TypeInfoMap = Map<TypeId, ResolvedTypeInfo>

type LocalizeOpts = { optional?: boolean, purpose?: TypePurpose, name?: string, typeArguments?: TypeInfo[], typeArgument?: TypeInfo }
type LocalizeData = { typeInfoMap: TypeInfoMap }

function _localizeTypeInfo(info: TypeInfo, data: LocalizeData, opts: LocalizeOpts = {}): LocalizedTypeInfo {
    const resolveInfo = (typeInfo: TypeInfo) => resolveTypeReferenceOrArray(typeInfo, typeInfoMap)

    const { typeInfoMap } = data
    const { purpose: purposeKind, optional, name } = opts

    const symbol = wrapSafe(localizeSymbol)(info.symbolMeta)
    const purpose = wrapSafe(localizePurpose)(purposeKind)

    const resolved = resolveInfo(info)
    
    info = resolved.info
    const dimension = resolved.dimension

    const isOptional = info.symbolMeta?.optional || optional || ((info.symbolMeta?.flags ?? 0) & ts.SymbolFlags.Optional)
    const isRest = info.symbolMeta?.rest

    const res: LocalizedTypeInfo = {
        kindText: getKind(info),
        kind: info.kind,
        alias: getAlias(info),
        symbol, purpose,
        ...isOptional && { optional: true },
        ...isRest && { rest: true },
        ...dimension && { dimension },
        ...(name !== undefined) && { name },
    }

    res.children = getChildren(info, opts)

    return res
}

function getChildren(info: ResolvedTypeInfo, { typeArguments: contextualTypeArguments, typeArgument }: LocalizeOpts = { }): TypeInfoChildren|undefined {
    const localizeOpts = (info: TypeInfo, opts?: LocalizeOpts) => ({ info, opts }) //_localizeTypeInfo(info, data, opts)
    const localize     = (info: TypeInfo) => localizeOpts(info)
    const createChild  = (localizedInfo: LocalizedTypeInfo) => ({ localizedInfo })

    const typeParameters = info.typeParameters
    const typeArguments = info.typeArguments ?? contextualTypeArguments

    let passTypeArguments: TypeInfo[]|undefined
    let parameterChildren: TypeInfoChildren

    if(info.kind === 'object' && info.objectClass) {
        passTypeArguments = typeArguments
        parameterChildren = getTypeParameterAndArgumentList(typeParameters, undefined)
    } else {
        parameterChildren = getTypeParameterAndArgumentList(typeParameters, typeArguments)
    }

    const baseChildren = getBaseChildren(passTypeArguments) 
    
    const children = [
        ...parameterChildren,
        ...baseChildren ?? [],
    ]

    return !isEmpty(children) ? children : undefined

    function getBaseChildren(typeArguments?: TypeInfo[]): TypeInfoChildren|undefined {
        switch(info.kind) {
            case "object": {
                const { properties, indexInfos = [], objectClass } = info
                return [
                    ...objectClass ? [ localizeOpts(objectClass, { purpose: 'object_class', typeArguments }) ] : [],
                    ...indexInfos.map(info => getLocalizedIndex(info)),
                    ...properties.map(localize),
                ]
            }
    
            case "class":
            case "interface": {
                const { properties, baseType, implementsTypes, constructSignatures } = info
                return [ 
                    ...baseType ? [localizeOpts(baseType, { purpose: 'class_base_type'})] : [],
                    ...isNonEmpty(implementsTypes) ? [createChild({ purpose: localizePurpose('class_implementations'), children: implementsTypes.map(localize) })] : [],
                    ...isNonEmpty(constructSignatures) ? [localizeOpts({ kind: 'function', id: getEmptyTypeId(), signatures: constructSignatures }, { purpose: 'class_constructor' })] : [],
                    ...properties.map(localize),
                ]
            }
    
            case "enum": {
                const { properties = [] } = info
                return properties.map(localize)
            }
    
            case "function": {
                const { signatures } = info
                
                if(signatures.length === 1) {
                    return getLocalizedSignatureChildren(signatures[0])
                } else {
                    return signatures.map(getLocalizedSignature)
                }
            }
    
            case "array": {
                throw new Error("Tried to get children for array type")
            }
    
            case "tuple": {
                const { types, names } = info
                return types.map((t, i) => localizeOpts(t, { name: names?.[i] }))
            }
    
            case "conditional": {
                const { checkType, extendsType, trueType, falseType } = info
    
                return [
                    localizeOpts(checkType, { purpose: 'conditional_check' }),
                    localizeOpts(extendsType, { purpose: 'conditional_extends'}),
                    ...trueType ? [localizeOpts(trueType, { purpose: 'conditional_true' })] : [],
                    ...falseType ? [localizeOpts(falseType, { purpose: 'conditional_false' })] : [],
                ]
            }
    
            case "index": {
                const { keyOf } = info
    
                return [
                    localizeOpts(keyOf, { purpose: 'keyof' })
                ]
            }
    
            case "indexed_access": {
                const { indexType, objectType } = info
    
                return [
                    localizeOpts(objectType, { purpose: 'indexed_access_base' }),
                    localizeOpts(indexType, { purpose: 'indexed_access_index' }),
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
    
                let i = 0, j = 0
    
                while(i < texts.length || j < types.length) {
                    if(i < texts.length) {
                        const text = texts[i]
                        if(text) {
                            // TODO: this should probably be its own treenode type
                            res.push(
                                localize({ kind: 'string_literal', id: getEmptyTypeId(), value: text })
                            )
                        }
                        i++
                    }
    
                    if(j < types.length) {
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

    function getTypeParameterAndArgumentList(typeParameters: TypeInfo[]|undefined, typeArguments: TypeInfo[]|undefined): TypeInfoChildren {
        if(typeParameters && typeArguments) {
            return [
                getTypeParameterList(typeParameters, typeArguments)
            ]
        } else {
            return [
                ...typeParameters ? [ getTypeParameterList(typeParameters) ] : [],
                ...typeArguments ? [ getTypeArgumentList(typeArguments) ] : [],
            ]
        }
    }

    function getLocalizedTypeParameter(info: TypeInfoKind<'type_parameter'>, value?: TypeInfo): TypeInfoChildren {
        const { defaultType, baseConstraint } = info
        return [
            ...value ? [localizeOpts(value, { purpose: 'parameter_value' })] : [],
            ...defaultType ? [localizeOpts(defaultType, { purpose: 'parameter_default' })] : [],
            ...baseConstraint ? [localizeOpts(baseConstraint, { purpose: 'parameter_base_constraint' })] : [],
        ]
    }

    function getTypeArgumentList(info: TypeInfo[]) {
        return createChild({
            purpose: localizePurpose("type_argument_list"),
            children: info.map(localize),
        })
    }

    function getTypeParameterList(typeParameters: TypeInfo[], typeArguments?: TypeInfo[]) {
        return createChild({
            purpose: localizePurpose("type_parameter_list"),
            children: typeParameters.map((param, i) => localizeOpts(param, { typeArgument: typeArguments?.[i] })),
        })
    }

    function getLocalizedIndex(indexInfo: IndexInfo) {
        return createChild({
            kindText: "index",
            symbol: wrapSafe(localizeSymbol)(indexInfo.parameterSymbol),
            children: [
                ...indexInfo.keyType ? [localizeOpts(indexInfo.keyType, { purpose: 'index_type'})] : [],
                ...indexInfo.type ? [localizeOpts(indexInfo.type, { purpose: 'index_value_type'})] : [],
            ]
        })
    }

    function getLocalizedSignature(signature: SignatureInfo){
        return createChild({
            kindText: "signature",
            symbol: wrapSafe(localizeSymbol)(signature.symbolMeta),
            children: getLocalizedSignatureChildren(signature),
        })
    }

    function getLocalizedSignatureChildren(signature: SignatureInfo) {
        return [
            ...signature.parameters.map(localize),
            ...signature.returnType ? [ localizeOpts(signature.returnType, { purpose: 'return' }) ] : [],
        ]
    }
}

function localizeSymbol(symbolInfo: SymbolInfo): LocalizedSymbolInfo {
    return {
        name: symbolInfo.name,
        ...symbolInfo.anonymous && { anonymous: symbolInfo.anonymous },
    }
}

function resolveTypeReferenceOrArray(info: TypeInfo, typeInfoMap: TypeInfoMap): { info: Exclude<ResolvedTypeInfo, { kind: 'array' }>, dimension: number }{
    let dimension = 0
    let resolvedInfo = info

    while(resolvedInfo.kind === 'array' || resolvedInfo.kind === 'reference') {
        if(resolvedInfo.kind === 'array') {
            dimension++
            resolvedInfo = resolvedInfo.type
        } else {
            resolvedInfo = resolveTypeReference(resolvedInfo, typeInfoMap)
        }
    }

    resolvedInfo = { 
        ...resolvedInfo,  
        symbolMeta: info.symbolMeta,
        id: info.id,
    }

    if(dimension === 0) {
        resolvedInfo.aliasSymbolMeta = info.aliasSymbolMeta
    }

    return { info: resolvedInfo, dimension }
}

function getAlias(info: ResolvedTypeInfo): string|undefined {
    const defaultValue = info.aliasSymbolMeta?.name

    switch(info.kind) {
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
            if(info.parentSymbol) {
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
    const kindText = (kind: LocalizableKind, ...args: string[]) => getKindText(kind, { insideClassOrInterface: info.symbolMeta?.insideClassOrInterface }, ...args)

    switch(info.kind) {
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

function resolveTypeReference(typeInfo: TypeInfo, typeInfoMap: TypeInfoMap): ResolvedTypeInfo {
    if(typeInfo.kind === 'reference') {
        const resolvedTypeInfo = typeInfoMap.get(typeInfo.id)
        assert(resolvedTypeInfo, "Encountered invalid type reference!")
        return resolvedTypeInfo
    }

    return typeInfo
}

function localizePurpose(purpose: TypePurpose): string {
    const nameByPurpose = {
        return: "return",
        index_type: "constraint",
        index_value_type: "value",
        conditional_check: "check",
        conditional_extends: "extends",
        conditional_true: "true",
        conditional_false: "false",
        keyof: "keyof",
        indexed_access_base: "base",
        indexed_access_index: "index",
        parameter_base_constraint: "extends",
        parameter_default: "default",
        parameter_value: "value",
        class_constructor: "constructor",
        class_base_type: "extends",
        class_implementations: "implements",
        object_class: "class",
        type_parameter_list: "type parameters",
        type_argument_list: "type arguments",
    }

    return nameByPurpose[purpose]
}

export function generateTypeInfoMap(tree: TypeInfo, cache?: TypeInfoMap): TypeInfoMap {
    cache ??= new Map()

    if(tree.kind === 'reference') { return cache }
    cache.set(tree.id, tree)
    getTypeInfoChildren(tree).forEach(c => generateTypeInfoMap(c, cache))

    return cache
}