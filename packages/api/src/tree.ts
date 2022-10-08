import assert from "assert";
import ts from "typescript";
import { IndexInfo, SignatureInfo, SymbolInfo, TypeId, TypeInfo, TypeInfoNode, TypeParameterInfo } from "./types";
import { getIntersectionTypesFlat, getSignaturesOfType, getSymbolType, getTypeId, isPureObject, wrapSafe } from "./util";

type TypeTreeContext = {
    typeChecker: ts.TypeChecker,
    seen?: Set<TypeId>
}

export function generateTypeTree({ symbol, type }: {symbol: ts.Symbol, type?: undefined} | {type: ts.Type, symbol?: undefined}, ctx: TypeTreeContext): TypeInfo {
    assert(symbol || type, "Must provide either symbol or type")
    const { typeChecker } = ctx
    
    if(!type) {
        type = getSymbolType(typeChecker, symbol!)
    }
    
    ctx.seen ||= new Set()
    
    if(!symbol) {
        symbol = type.getSymbol()
    }
    
    let typeInfo: TypeInfoNode
    if(!ctx.seen?.has(getTypeId(type))) {
        ctx.seen?.add(getTypeId(type))
        typeInfo = _generateTypeTree(typeChecker, type, ctx)
    } else {
        typeInfo = { kind: 'reference' }
    }

    const typeInfoId = typeInfo as TypeInfoNode & { id: number }

    typeInfoId.symbolMeta = wrapSafe(getSymbolInfo)(symbol)
    typeInfoId.id = getTypeId(type)

    return typeInfoId
}

function _generateTypeTree(typeChecker: ts.TypeChecker, type: ts.Type, ctx: TypeTreeContext): TypeInfoNode {
    const flags = type.getFlags()

    if(flags & ts.TypeFlags.Any) { return { kind: 'primitive', primitive: 'any' }}
    else if(flags & ts.TypeFlags.Unknown) { return { kind: 'primitive', primitive: 'unknown' }}
    else if(flags & ts.TypeFlags.Undefined) { return { kind: 'primitive', primitive: 'undefined' }}
    else if(flags & ts.TypeFlags.Null) { return { kind: 'primitive', primitive: 'null' }}
    else if(flags & ts.TypeFlags.Boolean) { return { kind: 'primitive', primitive: 'boolean' }}
    else if(flags & ts.TypeFlags.String) { return { kind: 'primitive', primitive: 'string' }}
    else if(flags & ts.TypeFlags.Number) { return { kind: 'primitive', primitive: 'number' }}
    else if(flags & ts.TypeFlags.Void) { return { kind: 'primitive', primitive: 'void' }}
    // TODO: add enum info ??
    else if(flags & ts.TypeFlags.Enum) { return { kind: 'primitive', primitive: 'enum' }}
    else if(flags & ts.TypeFlags.BigInt) { return { kind: 'primitive', primitive: 'bigint' }}
    else if(flags & ts.TypeFlags.ESSymbol || flags & ts.TypeFlags.ESSymbolLike) { return { kind: 'primitive', primitive: 'essymbol' }}
    else if(flags & ts.TypeFlags.UniqueESSymbol) { return { kind: 'primitive', primitive: 'unique_symbol' }}
    else if(flags & ts.TypeFlags.Never) { return { kind: 'primitive', primitive: 'never' }}
    else if(flags & ts.TypeFlags.StringLiteral) { return { kind: 'string_literal', value: (type as ts.StringLiteralType).value }}
    else if(flags & ts.TypeFlags.NumberLiteral) { return { kind: 'number_literal', value: (type as ts.NumberLiteralType).value }}
    // else if(flags & ts.TypeFlags.BooleanLiteral) { return { kind: 'boolean_literal', value: (type as ts.BooleanLiteral).value }}
    // else if(flags & ts.TypeFlags.EnumLiteral) { return { kind: 'enum_literal', value: (type as ts.StringLiteralType).value }}
    // TODO: add enum info???
    else if(flags & ts.TypeFlags.BigIntLiteral) { return { kind: 'bigint_literal', value: (type as ts.BigIntLiteralType).value }}
    // TODO: add type param info
    else if(flags & ts.TypeFlags.TypeParameter) {

    }
    else if(flags & ts.TypeFlags.Object) {
        // TODO: arrays
        return {
            kind: 'object',
            signatures: getSignaturesOfType(typeChecker, type).map(sig => getSignatureInfo(sig, ctx)),
            properties: type.getProperties().map(typeTreeSymb),
            indexInfos: typeChecker.getIndexInfosOfType(type).map(indexInfo => getIndexInfo(indexInfo, ctx))
        }
    } else if(flags & ts.TypeFlags.Union) {
        return {
            kind: 'union',
            types: (type as ts.UnionType).types.map(typeTree)
        }
    } else if(flags & ts.TypeFlags.Intersection) {
        const allTypes = getIntersectionTypesFlat(type)
        const types = allTypes.filter(t => !isPureObject(typeChecker, t)).map(typeTree)
        const properties = type.getProperties().map(typeTreeSymb)

        if(types.length === 0) {
            return {
                kind: 'object',
                properties
            }
        } else {
            return {
                kind: 'intersection',
                types, properties
            }
        }
    } else if(flags & ts.TypeFlags.Index) {
        return { kind: 'index', indexOf: typeTree((type as ts.IndexType).type) }
    } else if(flags & ts.TypeFlags.IndexedAccess) {
        return { 
            kind: 'indexed_access',
            indexType: typeTree((type as ts.IndexedAccessType).indexType),
            objectType: typeTree((type as ts.IndexedAccessType).objectType),
        }
    } else if(flags & ts.TypeFlags.Conditional) {
        // TODO: conditional types
    } else if(flags & ts.TypeFlags.Substitution) {
        return {
            kind: 'substitution',
            baseType: typeTree((type as ts.SubstitutionType).baseType),
            substitute: typeTree((type as ts.SubstitutionType).substitute),
        }
    } else if(flags & ts.TypeFlags.NonPrimitive) {
        // TODO: non primitive types ???
    } else if(flags & ts.TypeFlags.TemplateLiteral) {
        return {
            kind: 'template_literal',
            texts: (type as ts.TemplateLiteralType).texts,
            types: (type as ts.TemplateLiteralType).types.map(typeTree),
        }
    } else if(flags & ts.TypeFlags.StringMapping) {
        // TODO: string mapping
    }
    
    return {
        kind: 'primitive',
        primitive: 'unknown'
    }

    function typeTree(type: ts.Type) { return generateTypeTree({type}, ctx) }
    function typeTreeSymb(symbol: ts.Symbol) { return generateTypeTree({symbol}, ctx) }
}

// function getTypeParameterInfo(typeParameter: ts.TypeParameter, ctx: TypeTreeContext): TypeParameterInfo { }

function getSignatureInfo(signature: ts.Signature, ctx: TypeTreeContext): SignatureInfo {
    const { typeChecker } = ctx

    return {
        symbolMeta: wrapSafe(getSymbolInfo)(typeChecker.getSymbolAtLocation(signature.getDeclaration())),
        parameters: signature.getParameters().map((symbol) => generateTypeTree({ symbol }, ctx)),
        returnType: generateTypeTree({ type: typeChecker.getReturnTypeOfSignature(signature) }, ctx)
    }
}

function getIndexInfo(indexInfo: ts.IndexInfo, ctx: TypeTreeContext): IndexInfo {
    const { typeChecker } = ctx
    
    return {
        keyType: generateTypeTree({ type: indexInfo.keyType }, ctx),
        type: generateTypeTree({ type: indexInfo.type }, ctx),
        parameterSymbol: wrapSafe(getSymbolInfo)(wrapSafe(typeChecker.getSymbolAtLocation)(indexInfo.declaration?.parameters[0]))
    }
}

function getSymbolInfo(symbol: ts.Symbol): SymbolInfo {
    return {
        name: symbol.getName(),
    }
}