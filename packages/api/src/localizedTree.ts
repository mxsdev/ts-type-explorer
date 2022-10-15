import assert from "assert"
import * as ts from "typescript"
import { getKindText, getPrimitiveKindText, LocalizableKind } from "./localization"
import { IndexInfo, SignatureInfo, SymbolInfo, TypeId, TypeInfo, TypeInfoKind } from "./types"
import { getTypeInfoChildren } from "./tree"
import { getEmptyTypeId, pseudoBigIntToString, wrapSafe } from "./util"

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

type TypePurpose = 'return'|'index_type'|'index_value_type'|'conditional_check'|'conditional_extends'|'conditional_true'|'conditional_false'|'keyof'|'indexed_access_index'|'indexed_access_base'|'parameter_default'|'parameter_base_constraint'|'class_constructor'|'class_base_type'|'class_implementations'|'object_class'

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

type LocalizeOpts = { optional?: boolean, purpose?: TypePurpose, name?: string }
type LocalizeData = { typeInfoMap: TypeInfoMap }

function _localizeTypeInfo(info: TypeInfo, data: LocalizeData, opts: LocalizeOpts = {}): LocalizedTypeInfo {
    const { typeInfoMap } = data
    const { purpose: purposeKind, optional, name } = opts

    const symbol = wrapSafe(localizeSymbol)(info.symbolMeta)
    const purpose = wrapSafe(localizePurpose)(purposeKind)

    const resolved = resolveTypeReferenceOrArray(info, typeInfoMap)
    
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

    res.children = getChildren(info, data)

    return res
}

function getChildren(info: ResolvedTypeInfo, data: LocalizeData): TypeInfoChildren|undefined {
    const localizeOpts = (info: TypeInfo, opts?: LocalizeOpts) => ({ info, opts }) //_localizeTypeInfo(info, data, opts)
    const localize     = (info: TypeInfo) => localizeOpts(info)
    const createChild  = (localizedInfo: LocalizedTypeInfo) => ({ localizedInfo })

    switch(info.kind) {
        case "object": {
            const { properties, indexInfos = [], objectClass } = info
            return [
                ...objectClass ? [ localizeOpts(objectClass, { purpose: 'object_class' }) ] : [],
                ...indexInfos.map(info => getLocalizedIndex(info)),
                ...properties.map(localize),
            ]
        }

        case "class":
        case "interface": {
            const { properties, baseType, implementsTypes, constructSignatures, typeParameters } = info
            return [ 
                // TODO: type parameters
                // ...typeParameters ? [this.createNodeGroup(typeParameters, "Type Parameters")] : [],
                ...baseType ? [localizeOpts(baseType, { purpose: 'class_base_type'})] : [],
                ...(implementsTypes && implementsTypes.length > 0) ? [createChild({ purpose: localizePurpose('class_implementations'), children: implementsTypes.map(localize) })] : [],
                ...(constructSignatures && constructSignatures.length > 0) ? [localizeOpts({ kind: 'function', id: getEmptyTypeId(), signatures: constructSignatures }, { purpose: 'class_constructor' })] : [],
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
            const { defaultType, baseConstraint } = info
            return [
                ...defaultType ? [localizeOpts(defaultType, { purpose: 'parameter_default' })] : [],
                ...baseConstraint ? [localizeOpts(baseConstraint, { purpose: 'parameter_base_constraint' })] : [],
            ]
        }

        default: {
            return undefined
        }
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
        class_constructor: "constructor",
        class_base_type: "extends",
        class_implementations: "implements",
        object_class: "class",
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