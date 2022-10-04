import ts from "typescript";
function getTypeConstructor() {
    // @ts-expect-error
    return ts.objectAllocator.getTypeConstructor();
}
function getSymbolConstructor() {
    // @ts-expect-error
    return ts.objectAllocator.getSymbolConstructor();
}
export function getSymbolType(typeChecker, symbol, location) {
    // @ts-expect-error
    location || (location = { parent: {} });
    return typeChecker.getTypeOfSymbolAtLocation(symbol, location);
}
export function createType(checker, flags) {
    return new (getTypeConstructor())(checker, flags);
}
export function createObjectType(typeChecker, objectFlags, flags = 0) {
    const type = createType(typeChecker, flags | ts.TypeFlags.Object);
    type.members = new Map();
    type.objectFlags = objectFlags;
    type.properties = [];
    type.indexInfos = [];
    type.constructSignatures = [];
    type.callSignatures = [];
    return type;
}
export function createUnionType(typeChecker, types = [], flags = 0) {
    const type = createType(typeChecker, flags | ts.TypeFlags.Union);
    type.types = types;
    return type;
}
export function createIntersectionType(typeChecker, types = [], flags = 0) {
    const type = createType(typeChecker, flags | ts.TypeFlags.Intersection);
    type.types = types;
    return type;
}
export function createSymbol(flags, name, checkFlags) {
    const symbol = new (getSymbolConstructor())(flags | ts.SymbolFlags.Transient, name);
    symbol.checkFlags = checkFlags || 0;
    return symbol;
}
export function getTypeOrDeclaredType(typeChecker, symbol, location) {
    const type = getSymbolType(typeChecker, symbol, location);
    if (type.flags & ts.TypeFlags.Any) {
        return typeChecker.getDeclaredTypeOfSymbol(symbol);
    }
    return type;
}
export function resolvedTypeToString(typeChecker, ...args) {
    const [type, enclosingDeclaration, flags = 0] = args;
    return typeChecker.typeToString(type, enclosingDeclaration, flags | ts.TypeFormatFlags.InTypeAlias);
}
