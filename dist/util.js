"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvedTypeToString = exports.getTypeOrDeclaredType = exports.createSymbol = exports.createIntersectionType = exports.createUnionType = exports.createObjectType = exports.createType = exports.getSymbolType = void 0;
const typescript_1 = __importDefault(require("typescript"));
function getTypeConstructor() {
    // @ts-expect-error
    return typescript_1.default.objectAllocator.getTypeConstructor();
}
function getSymbolConstructor() {
    // @ts-expect-error
    return typescript_1.default.objectAllocator.getSymbolConstructor();
}
function getSymbolType(typeChecker, symbol, location) {
    // @ts-expect-error
    location || (location = { parent: {} });
    return typeChecker.getTypeOfSymbolAtLocation(symbol, location);
}
exports.getSymbolType = getSymbolType;
function createType(checker, flags) {
    return new (getTypeConstructor())(checker, flags);
}
exports.createType = createType;
function createObjectType(typeChecker, objectFlags, flags = 0) {
    const type = createType(typeChecker, flags | typescript_1.default.TypeFlags.Object);
    type.members = new Map();
    type.objectFlags = objectFlags;
    type.properties = [];
    type.indexInfos = [];
    type.constructSignatures = [];
    type.callSignatures = [];
    return type;
}
exports.createObjectType = createObjectType;
function createUnionType(typeChecker, types = [], flags = 0) {
    const type = createType(typeChecker, flags | typescript_1.default.TypeFlags.Union);
    type.types = types;
    return type;
}
exports.createUnionType = createUnionType;
function createIntersectionType(typeChecker, types = [], flags = 0) {
    const type = createType(typeChecker, flags | typescript_1.default.TypeFlags.Intersection);
    type.types = types;
    return type;
}
exports.createIntersectionType = createIntersectionType;
function createSymbol(flags, name, checkFlags) {
    const symbol = new (getSymbolConstructor())(flags | typescript_1.default.SymbolFlags.Transient, name);
    symbol.checkFlags = checkFlags || 0;
    return symbol;
}
exports.createSymbol = createSymbol;
function getTypeOrDeclaredType(typeChecker, symbol, location) {
    const type = getSymbolType(typeChecker, symbol, location);
    if (type.flags & typescript_1.default.TypeFlags.Any) {
        return typeChecker.getDeclaredTypeOfSymbol(symbol);
    }
    return type;
}
exports.getTypeOrDeclaredType = getTypeOrDeclaredType;
function resolvedTypeToString(typeChecker, sourceFile, type, enclosingDeclaration, flags = 0) {
    flags |= typescript_1.default.NodeBuilderFlags.InTypeAlias;
    const typeNode = typeChecker.typeToTypeNode(type, enclosingDeclaration, flags);
    if (!typeNode)
        return "";
    const printer = typescript_1.default.createPrinter();
    return printer.printNode(typescript_1.default.EmitHint.Unspecified, typeNode, sourceFile);
    // return typeChecker.typeToString(type, enclosingDeclaration, flags | ts.TypeFormatFlags.InTypeAlias)
}
exports.resolvedTypeToString = resolvedTypeToString;
//# sourceMappingURL=util.js.map