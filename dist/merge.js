"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursiveMergeIntersection = void 0;
const typescript_1 = __importDefault(require("typescript"));
const util_1 = require("./util");
function recursiveMergeIntersection(typeChecker, type) {
    return _recursiveMergeIntersection(typeChecker, [type], new WeakMap());
}
exports.recursiveMergeIntersection = recursiveMergeIntersection;
function _recursiveMergeIntersection(typeChecker, types, seen) {
    if (types.length === 1 && seen.has(types[0])) {
        return seen.get(types[0]);
    }
    const objectTypes = [];
    const otherTypes = [];
    for (const type of types) {
        if (type.flags & typescript_1.default.TypeFlags.Intersection) {
            ;
            type.types.forEach((type) => {
                if (type.flags & typescript_1.default.TypeFlags.Object) {
                    objectTypes.push(type);
                }
                else {
                    otherTypes.push(type);
                }
            });
        }
        else if (type.flags & typescript_1.default.TypeFlags.Union) {
            const newType = (0, util_1.createUnionType)(typeChecker);
            otherTypes.push(newType);
            seen.set(type, newType);
            const unionTypeMembers = type.types.map(t => _recursiveMergeIntersection(typeChecker, [t], seen));
            newType.types = unionTypeMembers;
        }
        else if (type.flags & typescript_1.default.TypeFlags.Object) {
            objectTypes.push(type);
        }
        else {
            otherTypes.push(type);
        }
    }
    if (otherTypes.length === 1 && objectTypes.length === 0) {
        const newType = cloneTypeWithoutAlias(otherTypes[0]);
        seen.set(otherTypes[0], newType);
        return newType;
    }
    else if (otherTypes.length === 0 && objectTypes.length > 0) {
        const newType = createAnonymousObjectType();
        if (types.length === 1)
            seen.set(types[0], newType);
        recursiveMergeObjectIntersection(objectTypes, newType);
        return newType;
    }
    else {
        const newType = (0, util_1.createIntersectionType)(typeChecker);
        if (types.length === 1)
            seen.set(types[0], newType);
        const objectType = recursiveMergeObjectIntersection(objectTypes);
        newType.types = [...(objectType ? [objectType] : []), ...otherTypes];
        return newType;
    }
    function createAnonymousObjectType() {
        return (0, util_1.createObjectType)(typeChecker, typescript_1.default.ObjectFlags.Anonymous);
    }
    function recursiveMergeObjectIntersection(types, newType) {
        newType || (newType = createAnonymousObjectType());
        const nameToSymbols = new Map();
        types.forEach((t) => {
            t.getProperties().forEach((s) => {
                const name = s.getEscapedName();
                if (!nameToSymbols.has(name)) {
                    nameToSymbols.set(name, []);
                }
                nameToSymbols.get(name).push(s);
            });
        });
        for (const [name, symbols] of nameToSymbols) {
            newType.properties.push(mergeIntersectedPropertySymbols(symbols, name));
        }
        return newType;
    }
    function mergeIntersectedPropertySymbols(symbols, name) {
        const symbol = (0, util_1.createSymbol)(typescript_1.default.SymbolFlags.Property, name, 1 << 18);
        const types = symbols.map(s => (0, util_1.getSymbolType)(typeChecker, s));
        symbol.type = _recursiveMergeIntersection(typeChecker, types, seen);
        return symbol;
    }
    function cloneTypeWithoutAlias(type) {
        type = cloneClassInstance(type);
        const symbol = type.getSymbol();
        if (type.aliasSymbol && symbol) {
            // remove type alias
            type.aliasSymbol = undefined;
        }
        return type;
    }
}
function cloneClassInstance(orig) {
    return Object.assign(Object.create(Object.getPrototypeOf(orig)), orig);
}
//# sourceMappingURL=merge.js.map