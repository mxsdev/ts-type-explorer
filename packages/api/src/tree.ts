import assert from "assert";
import ts, { createProgram, TypeChecker } from "typescript";
import { APIConfig } from "./config";
import { IndexInfo, SignatureInfo, SymbolInfo, TypeId, TypeInfo, TypeInfoNoId, TypeParameterInfo } from "./types";
import { getIndexInfos, getIntersectionTypesFlat, getSignaturesOfType, getSymbolType, getTypeId, TSIndexInfoMerged, isPureObject, wrapSafe, isArrayType, getTypeArguments, isTupleType, SignatureInternal, isParameterOptional } from "./util";

const maxDepthExceeded: TypeInfo = {kind: 'max_depth', id: -1}

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
    optional?: boolean
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
    
    let typeInfo: TypeInfoNoId
    if(!ctx.seen?.has(getTypeId(type))) {
        ctx.seen?.add(getTypeId(type))
        typeInfo = createNode(type)
    } else {
        typeInfo = { kind: 'reference' }
    }

    const typeInfoId = typeInfo as TypeInfo

    typeInfoId.symbolMeta = wrapSafe(getSymbolInfo)(symbol, isAnonymousSymbol, options)
    typeInfoId.id = getTypeId(type)

    ctx.depth--
    return typeInfoId

    function createNode(type: ts.Type): TypeInfoNoId {
        const flags = type.getFlags()
    
        if(flags & ts.TypeFlags.TypeParameter) {
            return { kind: 'type_parameter'}
        } else if(flags & ts.TypeFlags.Any) { return { kind: 'primitive', primitive: 'any' }}
        else if(flags & ts.TypeFlags.Unknown) { return { kind: 'primitive', primitive: 'unknown' }}
        else if(flags & ts.TypeFlags.Undefined) { return { kind: 'primitive', primitive: 'undefined' }}
        else if(flags & ts.TypeFlags.Null) { return { kind: 'primitive', primitive: 'null' }}
        else if(flags & ts.TypeFlags.Boolean) { return { kind: 'primitive', primitive: 'boolean' }}
        else if(flags & ts.TypeFlags.String) { return { kind: 'primitive', primitive: 'string' }}
        else if(flags & ts.TypeFlags.Number) { return { kind: 'primitive', primitive: 'number' }}
        else if(flags & ts.TypeFlags.Void) { return { kind: 'primitive', primitive: 'void' }}
        // TODO: add enum info ?
        else if(flags & ts.TypeFlags.Enum) { return { kind: 'primitive', primitive: 'enum' }}
        else if(flags & ts.TypeFlags.BigInt) { return { kind: 'primitive', primitive: 'bigint' }}
        else if(flags & ts.TypeFlags.ESSymbol || flags & ts.TypeFlags.ESSymbolLike) { return { kind: 'primitive', primitive: 'essymbol' }}
        else if(flags & ts.TypeFlags.UniqueESSymbol) { return { kind: 'primitive', primitive: 'unique_symbol' }}
        else if(flags & ts.TypeFlags.Never) { return { kind: 'primitive', primitive: 'never' }}
        else if(flags & ts.TypeFlags.StringLiteral) { return { kind: 'string_literal', value: (type as ts.StringLiteralType).value }}
        else if(flags & ts.TypeFlags.NumberLiteral) { return { kind: 'number_literal', value: (type as ts.NumberLiteralType).value }}
        // TODO: boolean literal
        // else if(flags & ts.TypeFlags.BooleanLiteral) { return { kind: 'boolean_literal', value: (type as ts.BooleanLiteral).value }}
        // TODO: enum literal
        // else if(flags & ts.TypeFlags.EnumLiteral) { return { kind: 'enum_literal', value: (type as ts.StringLiteralType).value }}
        // TODO: add enum info???
        else if(flags & ts.TypeFlags.BigIntLiteral) { return { kind: 'bigint_literal', value: (type as ts.BigIntLiteralType).value }}
        // TODO: add type param info
        else if(flags & ts.TypeFlags.Object) {
            const signatures = getSignaturesOfType(typeChecker, type).map(getSignatureInfo)

            if(signatures.length > 0) {
                return { kind: 'function', signatures }
            } else if(isArrayType(type)) {
                return {
                    kind: 'array',
                    type: parseType(getTypeArguments(typeChecker, type)[0])
                }
            } else if(isTupleType(type)) {
                // TODO: support named tuples
                return {
                    kind: 'tuple',
                    types: parseTypes(getTypeArguments(typeChecker, type))
                }
            } else {
                return {
                    kind: 'object',
                    properties: parseSymbols(type.getProperties()),
                    indexInfos: getIndexInfos(typeChecker, type).map(indexInfo => getIndexInfo(indexInfo)),
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
            return { kind: 'index', indexOf: parseType((type as ts.IndexType).type) }
        } else if(flags & ts.TypeFlags.IndexedAccess) {
            return { 
                kind: 'indexed_access',
                indexType: parseType((type as ts.IndexedAccessType).indexType),
                objectType: parseType((type as ts.IndexedAccessType).objectType),
            }
        } else if(flags & ts.TypeFlags.Conditional) {
            // TODO: conditional types
        } else if(flags & ts.TypeFlags.Substitution) {
            return {
                kind: 'substitution',
                baseType: parseType((type as ts.SubstitutionType).baseType),
                substitute: parseType((type as ts.SubstitutionType).substitute),
            }
        } else if(flags & ts.TypeFlags.NonPrimitive) {
            // TODO: non primitive types ???
        } else if(flags & ts.TypeFlags.TemplateLiteral) {
            return {
                kind: 'template_literal',
                texts: (type as ts.TemplateLiteralType).texts,
                types: parseTypes((type as ts.TemplateLiteralType).types)
            }
        } else if(flags & ts.TypeFlags.StringMapping) {
            // TODO: string mapping
        }
        
        return {
            kind: 'primitive',
            primitive: 'unknown'
        }
    }

    function parseTypes(types: readonly ts.Type[]): TypeInfo[] { return ctx.depth + 1 > maxDepth ? [maxDepthExceeded] : types.map(t => parseType(t))  }
    function parseType(type: ts.Type, options?: TypeTreeOptions): TypeInfo { return _generateTypeTree({type}, ctx, options) }

    function parseSymbols(symbols: readonly ts.Symbol[]): TypeInfo[] { return ctx.depth + 1 > maxDepth ? [maxDepthExceeded] : symbols.map(t => parseSymbol(t)) }
    function parseSymbol(symbol: ts.Symbol, options?: TypeTreeOptions): TypeInfo { return _generateTypeTree({symbol}, ctx, options) }

    function getSignatureInfo(signature: ts.Signature): SignatureInfo {
        const { typeChecker } = ctx

        const internalSignature = signature as SignatureInternal

        return {
            symbolMeta: wrapSafe(getSymbolInfo)(typeChecker.getSymbolAtLocation(signature.getDeclaration())),
            parameters: signature.getParameters().map((parameter, index) => getFunctionParameterInfo(parameter, signature, index)),
            returnType: parseType(typeChecker.getReturnTypeOfSignature(signature)),
            // minArgumentCount: internalSignature.resolvedMinArgumentCount ?? internalSignature.minArgumentCount
        }
    }

    function getFunctionParameterInfo(parameter: ts.Symbol, signature: ts.Signature, index: number): TypeInfo {
        return parseSymbol(parameter, {
            optional: isParameterOptional(typeChecker, parameter, signature)
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
        let optional = options.optional ?? isParameterOptional(typeChecker, symbol)

        return {
            name: symbol.getName(),
            flags: symbol.getFlags(),
            ...isAnonymous && { anonymous: true },
            ...optional && { optional: true },
        }
    }
}

export function getTypeInfoChildren(info: TypeInfo): TypeInfo[] {
    switch(info.kind) {
        case 'object': {
            return [
                ...info.properties,
                ...info.indexInfos?.flatMap(x => [
                    ...(x.type ? [x.type] : []),
                    ...(x.keyType ? [x.keyType] : []),
                ]) ?? [],
            ]
        }

        case "intersection": {
            return [...info.types, ...info.properties]
        }

        case "union": {
            return info.types
        }

        case "index": {
            return [info.indexOf]
        }

        case "indexed_access": {
            return [info.indexType, info.objectType]
        }

        case "conditional": {
            return [ 
                info.checkType, info.extendsType,  
                ...info.falseType ? [info.falseType] : [],
                ...info.trueType ? [info.trueType] : [],
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
            return info.signatures.flatMap(s => [...s.parameters, s.returnType])
        }
    }

    return []
}