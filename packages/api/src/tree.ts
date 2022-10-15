import assert from "assert";
import ts, { createProgram, TypeChecker } from "typescript";
import { APIConfig } from "./config";
import { IndexInfo, SignatureInfo, SymbolInfo, TypeId, TypeInfo, TypeInfoNoId } from "./types";
import { getIndexInfos, getIntersectionTypesFlat, getSignaturesOfType, getSymbolType, getTypeId, TSIndexInfoMerged, isPureObject, wrapSafe, isArrayType, getTypeArguments, isTupleType, SignatureInternal, getParameterInfo, IntrinsicTypeInternal, TSSymbol, isClassType, isClassOrInterfaceType, isInterfaceType, getImplementsTypes, filterUndefined, createSymbol, getConstructSignatures, getEmptyTypeId } from "./util";

const maxDepthExceeded: TypeInfo = {kind: 'max_depth', id: getEmptyTypeId()}

type TypeTreeContext = {
    typeChecker: ts.TypeChecker,
    config: APIConfig,
    seen: Set<TypeId>,
    depth: number,
}

type SymbolOrType = {symbol: ts.Symbol, type?: undefined} | {type: ts.Type, symbol?: undefined}

export function generateTypeTree(symbolOrType: SymbolOrType, typeChecker: TypeChecker, config?: APIConfig) {
    return _generateTypeTree(
        symbolOrType,
        {
            typeChecker, config: config ?? new APIConfig(),
            seen: new Set(),
            depth: 0
        }
    )
}

type TypeTreeOptions = {
    optional?: boolean,
    isRest?: boolean,
    insideClassOrInterface?: boolean,
}

function _generateTypeTree({ symbol, type }: SymbolOrType, ctx: TypeTreeContext, options?: TypeTreeOptions): TypeInfo {
    assert(symbol || type, "Must provide either symbol or type")
    ctx.depth++

    const { typeChecker  } = ctx
    const maxDepth = ctx.config.maxDepth

    if(ctx.depth > maxDepth) { // TODO: allow custom maximum depth
        ctx.depth--
        return maxDepthExceeded
    }
    
    if(!type) {
        type = getSymbolType(typeChecker, symbol!)
    }
    
    let isAnonymousSymbol = !symbol
    
    if(!symbol) {
        const associatedSymbol = type.getSymbol()

        if(associatedSymbol) {
            isAnonymousSymbol = associatedSymbol.name === "__type"
            symbol = associatedSymbol
        }
    }

    let classSymbol: ts.Symbol|undefined

    if(type.symbol) {
        if(type.symbol.flags & ts.SymbolFlags.Class) {
            const classDefinition = type.symbol.declarations?.[0] as ts.NamedDeclaration|undefined
            if(classDefinition && classDefinition.name) {
                classSymbol = type.symbol
            }
            
            if(symbol && symbol.flags & ts.SymbolFlags.Class) {
                const signatures = typeChecker.getSignaturesOfType(type, ts.SignatureKind.Construct)
                const returnType = wrapSafe(typeChecker.getReturnTypeOfSignature)(signatures[0])

                type = returnType ?? type
            }
        }
    }
    
    let typeInfo: TypeInfoNoId
    const id = getTypeId(type, symbol)

    if(!ctx.seen?.has(id)) {
        ctx.seen?.add(id)
        typeInfo = createNode(type)
    } else {
        typeInfo = { kind: 'reference' }
    }

    const typeInfoId = typeInfo as TypeInfo

    typeInfoId.symbolMeta = wrapSafe(getSymbolInfo)(symbol, isAnonymousSymbol, options)

    if(type.aliasSymbol && type.aliasSymbol !== symbol) {
        typeInfoId.aliasSymbolMeta = getSymbolInfo(type.aliasSymbol)
    }

    if(type.symbol && type.symbol !== type.aliasSymbol && type.symbol !== symbol) {
        typeInfoId.typeSymbolMeta = getSymbolInfo(type.symbol)
    }

    typeInfoId.id = id

    ctx.depth--
    return typeInfoId

    function createNode(type: ts.Type): TypeInfoNoId {
        const flags = type.getFlags()
    
        if(flags & ts.TypeFlags.TypeParameter) {
            return {
                kind: 'type_parameter',
                baseConstraint: wrapSafe(parseType)(typeChecker.getBaseConstraintOfType(type)),
                defaultType: wrapSafe(parseType)(typeChecker.getDefaultFromTypeParameter(type)),
            }
        } else if(flags & ts.TypeFlags.Any) { 
            if((type as IntrinsicTypeInternal).intrinsicName === "intrinsic") {
                return { kind: 'intrinsic' }
            }

            return { kind: 'primitive', primitive: 'any' }
        }
        else if(flags & ts.TypeFlags.Unknown) { return { kind: 'primitive', primitive: 'unknown' }}
        else if(flags & ts.TypeFlags.Undefined) { return { kind: 'primitive', primitive: 'undefined' }}
        else if(flags & ts.TypeFlags.Null) { return { kind: 'primitive', primitive: 'null' }}
        else if(flags & ts.TypeFlags.Boolean) { return { kind: 'primitive', primitive: 'boolean' }}
        else if(flags & ts.TypeFlags.String) { return { kind: 'primitive', primitive: 'string' }}
        else if(flags & ts.TypeFlags.Number) { return { kind: 'primitive', primitive: 'number' }}
        else if(flags & ts.TypeFlags.Void) { return { kind: 'primitive', primitive: 'void' }}
        else if(flags & ts.TypeFlags.EnumLiteral) { 
            return { 
                kind: 'enum_literal',
                value: (type as ts.StringLiteralType).value,
                literalSymbol: getSymbolInfo(type.symbol),
                parentSymbol: wrapSafe(getSymbolInfo)((type.symbol as TSSymbol).parent),
            }
        }
        else if(flags & ts.TypeFlags.Enum) { return { kind: 'enum' }}
        else if(flags & ts.TypeFlags.BigInt) { return { kind: 'primitive', primitive: 'bigint' }}
        else if(flags & ts.TypeFlags.ESSymbol || flags & ts.TypeFlags.ESSymbolLike) { return { kind: 'primitive', primitive: 'essymbol' }}
        else if(flags & ts.TypeFlags.UniqueESSymbol) { return { kind: 'primitive', primitive: 'unique_symbol' }}
        else if(flags & ts.TypeFlags.Never) { return { kind: 'primitive', primitive: 'never' }}
        else if(flags & ts.TypeFlags.StringLiteral) { return { kind: 'string_literal', value: (type as ts.StringLiteralType).value }}
        else if(flags & ts.TypeFlags.NumberLiteral) { return { kind: 'number_literal', value: (type as ts.NumberLiteralType).value }}
        else if(flags & ts.TypeFlags.BooleanLiteral) { return { kind: 'boolean_literal', value: (type as IntrinsicTypeInternal).intrinsicName === "true" }}
        else if(flags & ts.TypeFlags.BigIntLiteral) { return { kind: 'bigint_literal', value: (type as ts.BigIntLiteralType).value }}
        // TODO: add type param info
        else if(flags & ts.TypeFlags.Object) {
            const { symbol: typeSymbol } = type
            if(typeSymbol && typeSymbol.flags & ts.SymbolFlags.Enum) {
                return {
                    kind: 'enum',
                    properties: parseSymbols(type.getProperties()),
                }
            }

            const signatures = getSignaturesOfType(typeChecker, type)

            if(isArrayType(type)) {
                return {
                    kind: 'array',
                    type: parseType(getTypeArguments(typeChecker, type)[0])
                }
            } else if(isTupleType(type)) {
                return {
                    kind: 'tuple',
                    types: parseTypes(getTypeArguments(typeChecker, type)),
                    names: (type.target as ts.TupleType).labeledElementDeclarations?.map(s => s.name.getText()),
                }
            } else if(isInterfaceType(type) || (isClassType(type) && symbol && symbol.flags & ts.SymbolFlags.Class)) {
                // TODO: class instances instantiated with generics are treated as objects, not classes
                return {
                    kind: isClassType(type) ? 'class' : isInterfaceType(type) ? 'interface' : assert(false, "Should be class or interface type") as never,
                    properties: parseSymbols(type.getProperties(), { insideClassOrInterface: true }),
                    baseType: wrapSafe(parseType)(type.getBaseTypes()?.[0]),
                    implementsTypes: wrapSafe(parseTypes)(getImplementsTypes(typeChecker, type)),
                    typeParameters: wrapSafe(parseTypes)(type.typeParameters),
                    constructSignatures: getConstructSignatures(typeChecker, type).map(s => getSignatureInfo(s, false)),
                    classSymbol: wrapSafe(getSymbolInfo)(classSymbol),
                }
            } else if(signatures.length > 0) {
                return { kind: 'function', signatures: signatures.map(s => getSignatureInfo(s)) }
            } else {
                return {
                    kind: 'object',
                    properties: parseSymbols(type.getProperties()),
                    indexInfos: getIndexInfos(typeChecker, type).map(indexInfo => getIndexInfo(indexInfo)),
                    objectClass: wrapSafe(parseSymbol)(classSymbol),
                }
            }
        } else if(flags & ts.TypeFlags.Union) {
            return {
                kind: 'union',
                types: parseTypes((type as ts.UnionType).types)
            }
        } else if(flags & ts.TypeFlags.Intersection) {
            const allTypes = getIntersectionTypesFlat(type)
            const types = parseTypes(allTypes.filter(t => !isPureObject(typeChecker, t)))
            const properties = parseSymbols(type.getProperties())
    
            if(types.length === 0) {
                return {
                    kind: 'object',
                    properties,
                }
            } else {
                return {
                    kind: 'intersection',
                    types, properties
                }
            }
        } else if(flags & ts.TypeFlags.Index) {
            return { kind: 'index', keyOf: parseType((type as ts.IndexType).type) }
        } else if(flags & ts.TypeFlags.IndexedAccess) {
            return { 
                kind: 'indexed_access',
                indexType: parseType((type as ts.IndexedAccessType).indexType),
                objectType: parseType((type as ts.IndexedAccessType).objectType),
            }
        } else if(flags & ts.TypeFlags.Conditional) {
            // force resolution of true/false types
            typeChecker.typeToString(type, undefined, ts.TypeFormatFlags.InTypeAlias)

            return {
                kind: 'conditional',
                checkType: parseType((type as ts.ConditionalType).checkType),
                extendsType: parseType((type as ts.ConditionalType).extendsType),
                trueType: wrapSafe(parseType)((type as ts.ConditionalType).resolvedTrueType),
                falseType: wrapSafe(parseType)((type as ts.ConditionalType).resolvedFalseType),
            }
        } else if(flags & ts.TypeFlags.Substitution) {
            return {
                kind: 'substitution',
                baseType: parseType((type as ts.SubstitutionType).baseType),
                substitute: parseType((type as ts.SubstitutionType).substitute),
            }
        } else if(flags & ts.TypeFlags.NonPrimitive) {
            return {
                kind: 'non_primitive'
            }
        } else if(flags & ts.TypeFlags.TemplateLiteral) {
            return {
                kind: 'template_literal',
                texts: (type as ts.TemplateLiteralType).texts,
                types: parseTypes((type as ts.TemplateLiteralType).types)
            }
        } else if(flags & ts.TypeFlags.StringMapping) {
            return {
                kind: 'string_mapping',
                typeSymbol: getSymbolInfo((type as ts.StringMappingType).symbol),
                type: parseType((type as ts.StringMappingType).type),
            }
        }
        
        return {
            kind: 'primitive',
            primitive: 'unknown'
        }
    }

    function parseTypes(types: readonly ts.Type[]): TypeInfo[] { return ctx.depth + 1 > maxDepth ? [maxDepthExceeded] : types.map(t => parseType(t))  }
    function parseType(type: ts.Type, options?: TypeTreeOptions): TypeInfo { return _generateTypeTree({type}, ctx, options) }

    function parseSymbols(symbols: readonly ts.Symbol[], options?: TypeTreeOptions): TypeInfo[] { return ctx.depth + 1 > maxDepth ? [maxDepthExceeded] : symbols.map(t => parseSymbol(t, options)) }
    function parseSymbol(symbol: ts.Symbol, options?: TypeTreeOptions): TypeInfo { return _generateTypeTree({symbol}, ctx, options) }

    function getSignatureInfo(signature: ts.Signature, includeReturnType = true): SignatureInfo {
        const { typeChecker } = ctx

        return {
            symbolMeta: wrapSafe(getSymbolInfo)(typeChecker.getSymbolAtLocation(signature.getDeclaration())),
            parameters: signature.getParameters().map((parameter, index) => getFunctionParameterInfo(parameter, signature, index)),
            ...includeReturnType && { returnType: parseType(typeChecker.getReturnTypeOfSignature(signature)) },
        }
    }

    function getFunctionParameterInfo(parameter: ts.Symbol, signature: ts.Signature, index: number): TypeInfo {
        const { optional, isRest } = getParameterInfo(typeChecker, parameter, signature)

        return parseSymbol(parameter, {
            optional, isRest
        })
    }
    
    function getIndexInfo(indexInfo: TSIndexInfoMerged): IndexInfo {
        const { typeChecker } = ctx

        const parameterSymbol =
            // @ts-expect-error
            indexInfo?.declaration?.parameters?.[0]?.symbol
         ?? indexInfo?.parameterType?.getSymbol()
        
        return {
            ...indexInfo.keyType && { keyType: parseType(indexInfo.keyType) },
            ...indexInfo.type && { type: parseType(indexInfo.type) },
            // parameterSymbol: wrapSafe(getSymbolInfo)(wrapSafe(typeChecker.getSymbolAtLocation)(indexInfo?.declaration?.parameters?.[0]))
            parameterSymbol: wrapSafe(getSymbolInfo)(parameterSymbol),
        }
    }
    
    function getSymbolInfo(symbol: ts.Symbol, isAnonymous: boolean = false, options: TypeTreeOptions = {}): SymbolInfo {
        const parameterInfo = getParameterInfo(typeChecker, symbol)

        const optional = options.optional ?? parameterInfo.optional
        const rest = options.isRest ?? parameterInfo.isRest

        const parent = (symbol as TSSymbol).parent
        const insideClassOrInterface = options.insideClassOrInterface ?? (parent && parent.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface))

        return {
            name: symbol.getName(),
            flags: symbol.getFlags(),
            ...isAnonymous && { anonymous: true },
            ...optional && { optional: true },
            ...rest && { rest: true },
            ...insideClassOrInterface && { insideClassOrInterface: true }
        }
    }
}

export function getTypeInfoChildren(info: TypeInfo): TypeInfo[] {
    const mapSignatureInfo = (signature: SignatureInfo) => [...signature.parameters, signature.returnType]

    return filterUndefined(_getTypeInfoChildren(info))

    function _getTypeInfoChildren(info: TypeInfo): (TypeInfo|undefined)[] {
        switch(info.kind) {
            case 'object': {
                return [
                    ...info.properties,
                    ...info.indexInfos?.flatMap(x => [ x.type, x.keyType ]) ?? [],
                ]
            }
    
            case "intersection": {
                return [...info.types, ...info.properties]
            }
    
            case "union": {
                return info.types
            }
    
            case "index": {
                return [info.keyOf]
            }
    
            case "indexed_access": {
                return [info.indexType, info.objectType]
            }
    
            case "conditional": {
                return [ 
                    info.checkType, info.extendsType,  
                    info.falseType, info.trueType
                ]
            }
    
            case "substitution": {
                return [info.baseType, info.substitute]
            }
    
            case "template_literal": {
                return info.types
            }
    
            case "array": {
                return [info.type]
            }
    
            case "tuple": {
                return info.types
            }
    
            case "function": {
                return info.signatures.flatMap(mapSignatureInfo)
            }
    
            case "enum": {
                return [
                    ...info.properties ?? []
                ]
            }
    
            case "type_parameter": {
                return [
                    info.defaultType, info.baseConstraint,
                ]
            }
    
            case "interface":
            case "class": {
                return [
                    ...info.properties,
                    ...info.typeParameters ?? [],
                    ...info.constructSignatures?.flatMap(mapSignatureInfo) ?? [],
                    info.baseType,
                    ...info.implementsTypes ?? [],
                ]
            }
        }

        return []
    }
}