import ts from "typescript"
import { createUnionType, createIntersectionType, createObjectType, TSSymbol, createSymbol, getSymbolType, SymbolName, ObjectType } from "./util"

export function recursiveMergeIntersection(typeChecker: ts.TypeChecker, type: ts.Type) {
    return _recursiveMergeIntersection(typeChecker, [type], new WeakMap())
}

function _recursiveMergeIntersection(typeChecker: ts.TypeChecker, types: ts.Type[], seen: WeakMap<ts.Type, ts.Type>): ts.Type {
    if(types.length === 1 && seen.has(types[0])) {
        return seen.get(types[0])!
    }

    const objectTypes: ts.ObjectType[] = []
    const otherTypes: ts.Type[] = []
    let res: ts.Type
    
    for(const type of types) {
        if(type.flags & ts.TypeFlags.Intersection) {
            ;(type as ts.IntersectionType).types.forEach((type) => {
                if(type.flags & ts.TypeFlags.Object) {
                    objectTypes.push(type as ts.ObjectType)
                } else {
                    otherTypes.push(type)
                }
            })
        } else if(type.flags & ts.TypeFlags.Union) {
            const newType = createUnionType(typeChecker, ) 
            otherTypes.push(newType)
            seen.set(type, newType)

            const unionTypeMembers = (type as ts.UnionType).types.map(t => _recursiveMergeIntersection(typeChecker, [t], seen))
            newType.types = unionTypeMembers
        } else if(type.flags & ts.TypeFlags.Object) {
            objectTypes.push(type as ts.ObjectType)
        } else {
            otherTypes.push(type)
        }
    }

    if(otherTypes.length === 1 && objectTypes.length === 0) {
        if(types.length === 1) seen.set(types[0], otherTypes[0])
        return otherTypes[0]
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
        const symbol = createSymbol(ts.SymbolFlags.Property, name, 1 << 18)

        const types = symbols.map(s => getSymbolType(typeChecker, s))
        
        symbol.type = _recursiveMergeIntersection(typeChecker, types, seen)

        return symbol
    }
}