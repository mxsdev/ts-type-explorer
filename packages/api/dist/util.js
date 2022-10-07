"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multilineTypeToString = exports.createSymbol = exports.createIntersectionType = exports.createUnionType = exports.createObjectType = exports.createType = exports.getIndexInfos = exports.getSignaturesOfType = exports.getSymbolType = exports.getSymbolDeclaration = exports.isValidType = void 0;
const typescript_1 = __importDefault(require("typescript"));
function getTypeConstructor() {
    // @ts-expect-error
    return typescript_1.default.objectAllocator.getTypeConstructor();
}
function getSymbolConstructor() {
    // @ts-expect-error
    return typescript_1.default.objectAllocator.getSymbolConstructor();
}
function isValidType(type) {
    return (!('intrinsicName' in type) ||
        type.intrinsicName !== 'error');
}
exports.isValidType = isValidType;
;
function getSymbolDeclaration(symbol) {
    var _a;
    return symbol
        ? symbol.valueDeclaration || ((_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a[0])
        : undefined;
}
exports.getSymbolDeclaration = getSymbolDeclaration;
;
function getSymbolType(typeChecker, symbol, location) {
    if (location) {
        const type = typeChecker.getTypeOfSymbolAtLocation(symbol, location);
        if (isValidType(type)) {
            return type;
        }
    }
    const declaration = getSymbolDeclaration(symbol);
    if (declaration) {
        const type = typeChecker.getTypeOfSymbolAtLocation(symbol, declaration);
        if (isValidType(type)) {
            return type;
        }
    }
    const symbolType = typeChecker.getDeclaredTypeOfSymbol(symbol);
    if (isValidType(symbolType)) {
        return symbolType;
    }
    return typeChecker.getTypeOfSymbolAtLocation(symbol, { parent: {} });
}
exports.getSymbolType = getSymbolType;
function getSignaturesOfType(typeChecker, type) {
    return [
        ...typeChecker.getSignaturesOfType(type, typescript_1.default.SignatureKind.Call),
        ...typeChecker.getSignaturesOfType(type, typescript_1.default.SignatureKind.Construct),
    ];
}
exports.getSignaturesOfType = getSignaturesOfType;
function getIndexInfos(typeChecker, type) {
    return typeChecker.getIndexInfosOfType(type);
}
exports.getIndexInfos = getIndexInfos;
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
function multilineTypeToString(typeChecker, sourceFile, type, enclosingDeclaration, flags = 0) {
    const typeNode = typeChecker.typeToTypeNode(type, enclosingDeclaration, flags);
    if (!typeNode)
        return "";
    const printer = typescript_1.default.createPrinter();
    return printer.printNode(typescript_1.default.EmitHint.Unspecified, typeNode, sourceFile);
}
exports.multilineTypeToString = multilineTypeToString;
//# sourceMappingURL=util.js.map