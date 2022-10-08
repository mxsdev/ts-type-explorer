import ts from "typescript"
import { createUnionType, createIntersectionType, createObjectType, TSSymbol, createSymbol, getSymbolType, SymbolName, ObjectType, getSignaturesOfType, getIndexInfos, getIntersectionTypesFlat } from "./util"

export function recursivelyExpandType(typeChecker: ts.TypeChecker, type: ts.Type) {
    return _recursivelyExpandType(typeChecker, [type], new WeakMap())
}

function _recursivelyExpandType(typeChecker: ts.TypeChecker, types: ts.Type[], seen: WeakMap<ts.Type, ts.Type>): ts.Type {
    if(types.length === 1 && seen.has(types[0])) {
        return seen.get(types[0])!
    }

    const objectTypes: ts.ObjectType[] = []
    const otherTypes: ts.Type[] = []

    function pushType(type: ts.Type) {
        if(type.flags & ts.TypeFlags.Intersection) {
            getIntersectionTypesFlat(type).forEach(pushType)
        } else if(type.flags & ts.TypeFlags.Union) {
            const newType = createUnionType(typeChecker) 
            otherTypes.push(newType)
            seen.set(type, newType)
    
            const unionTypeMembers = (type as ts.UnionType).types.map(t => _recursivelyExpandType(typeChecker, [t], seen))
            newType.types = unionTypeMembers
        } else if(type.flags & ts.TypeFlags.Object) {
            if(getSignaturesOfType(typeChecker, type).length > 0) {
                // function type
                otherTypes.push(type)
            } else if(getIndexInfos(typeChecker, type).length > 0) {
                // mapped type
                otherTypes.push(type)
            } else { // TODO: array types
                objectTypes.push(type as ts.ObjectType)
            }
        } else {
            otherTypes.push(type)
        }
    }

    types.forEach(pushType)

    if(otherTypes.length === 1 && objectTypes.length === 0) {
        const newType = cloneTypeWithoutAlias(otherTypes[0])
        seen.set(otherTypes[0], newType)

        return newType
    } else if(otherTypes.length === 0 && objectTypes.length > 0) {
        const newType = createAnonymousObjectType()
        if(types.length === 1) seen.set(types[0], newType)

        recursiveMergeObjectIntersection(objectTypes, newType)

        return newType
    } else {
        const newType = createIntersectionType(typeChecker)
        if(types.length === 1) seen.set(types[0], newType)
        
        const objectType = recursiveMergeObjectIntersection(objectTypes)
        newType.types = [...(objectType ? [objectType] : []), ...otherTypes]

        return newType
    }

    function createAnonymousObjectType() {
        return createObjectType(typeChecker, ts.ObjectFlags.Anonymous)
    }

    function recursiveMergeObjectIntersection(types: ts.ObjectType[], newType?: ObjectType) {
        newType ||= createAnonymousObjectType()
        const nameToSymbols = new Map<SymbolName, TSSymbol[]>()
    
        types.forEach((t) => {
            t.getProperties().forEach((s) => {
                const name = s.getEscapedName()

                if(!nameToSymbols.has(name)) {
                    nameToSymbols.set(name, [])
                }

                nameToSymbols.get(name)!.push(s as TSSymbol)
            })
        })

        for(const [name, symbols] of nameToSymbols) {
            newType.properties.push(mergeIntersectedPropertySymbols(symbols, name))
        }

        return newType
    }

    function mergeIntersectedPropertySymbols(symbols: TSSymbol[], name: SymbolName): TSSymbol {
        const propertySymbol = createSymbol(ts.SymbolFlags.Property, name, 1 << 18)

        const types = symbols.map(s => getSymbolType(typeChecker, s))
        
        propertySymbol.type = _recursivelyExpandType(typeChecker, types, seen)

        return propertySymbol
    }

    function cloneTypeWithoutAlias(type: ts.Type) {
        type = cloneClassInstance(type)

        const symbol = type.getSymbol()

        if(type.aliasSymbol && symbol) {
            // remove type alias
            type.aliasSymbol = undefined
        }

        return type
    }
}

function cloneClassInstance<T>(orig: T): T {
    return Object.assign(Object.create(Object.getPrototypeOf(orig)), orig) as T
}