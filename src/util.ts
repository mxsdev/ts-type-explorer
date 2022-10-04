import ts from "typescript"

export type SymbolName = ts.__String

type TypeConstructor = new (checker: ts.TypeChecker, flags: ts.TypeFlags) => ts.Type
type SymbolConstructor = new (flags: ts.SymbolFlags, name: SymbolName) => ts.Symbol

function getTypeConstructor() {
    // @ts-expect-error
    return ts.objectAllocator.getTypeConstructor() as TypeConstructor
}

function getSymbolConstructor() {
    // @ts-expect-error
    return ts.objectAllocator.getSymbolConstructor() as SymbolConstructor
}

export type ObjectType = ts.ObjectType & { 
    id: number, 
    members: ts.SymbolTable,
    properties: ts.Symbol[],
    indexInfos: ts.IndexInfo[],
    constructSignatures: ts.Signature[],
    callSignatures: ts.Signature[],
}

export type UnionType = ts.UnionType & { id: number }
export type IntersectionType = ts.IntersectionType & { id: number }

export type TSSymbol = ts.Symbol & {
    checkFlags: number,
    type?: ts.Type,
}

export function getSymbolType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node) {
    // @ts-expect-error
    location ||= { parent: {} }
    return typeChecker.getTypeOfSymbolAtLocation(symbol, location!)
}

export function createType(checker: ts.TypeChecker, flags: ts.TypeFlags) {
    return new (getTypeConstructor())(checker, flags)
}

export function createObjectType(typeChecker: ts.TypeChecker, objectFlags: ts.ObjectFlags, flags: ts.TypeFlags = 0): ObjectType {
    const type = createType(typeChecker, flags | ts.TypeFlags.Object) as ObjectType
    type.members = new Map()
    type.objectFlags = objectFlags
    type.properties = []
    type.indexInfos = []
    type.constructSignatures = []
    type.callSignatures = []

    return type
}

export function createUnionType(typeChecker: ts.TypeChecker, types: ts.Type[] = [], flags: ts.TypeFlags = 0): UnionType { 
    const type = createType(typeChecker, flags | ts.TypeFlags.Union) as UnionType

    type.types = types

    return type
}

export function createIntersectionType(typeChecker: ts.TypeChecker, types: ts.Type[] = [], flags: ts.TypeFlags = 0): IntersectionType { 
    const type = createType(typeChecker, flags | ts.TypeFlags.Intersection) as IntersectionType

    type.types = types

    return type
}

export function createSymbol(flags: ts.SymbolFlags, name: SymbolName, checkFlags?: number) {
    const symbol = (new (getSymbolConstructor())(flags | ts.SymbolFlags.Transient, name) as TSSymbol);
    symbol.checkFlags = checkFlags || 0;
    return symbol;
}

export function getTypeOrDeclaredType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node) {
    const type = getSymbolType(typeChecker, symbol, location)

    if(type.flags & ts.TypeFlags.Any) {
        return typeChecker.getDeclaredTypeOfSymbol(symbol)
    }

    return type
}

export function resolvedTypeToString(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, ...args: (Parameters<ts.TypeChecker['typeToString']>)) {
    let [ type, enclosingDeclaration, flags = 0 ] = args
    flags |= ts.TypeFormatFlags.InTypeAlias

    const typeNode = typeChecker.typeToTypeNode(type, enclosingDeclaration, flags)
    if(!typeNode) return ""

    const printer = ts.createPrinter()
    return printer.printNode(ts.EmitHint.Unspecified, typeNode, sourceFile)

    // return typeChecker.typeToString(type, enclosingDeclaration, flags | ts.TypeFormatFlags.InTypeAlias)
}