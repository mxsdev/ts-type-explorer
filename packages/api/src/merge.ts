import ts from "typescript"
import { APIConfig } from "./config"
import { createUnionType, createIntersectionType, createObjectType, TSSymbol, createSymbol, getSymbolType, SymbolName, ObjectType, getSignaturesOfType, getIndexInfos, getIntersectionTypesFlat, isArrayType, isTupleType, TypeReferenceInternal } from "./util"

export function recursivelyExpandType(typeChecker: ts.TypeChecker, type: ts.Type, config?: APIConfig) {
    config ??= new APIConfig()

    return _recursivelyExpandType(typeChecker, [type], {
        seen: new WeakMap(),
        maxDepth: config.maxDepth,
        depth: 0,
    })
}

type RecursiveExpandContext = {
    seen: WeakMap<ts.Type, ts.Type>,
    depth: number,
    maxDepth: number
}

function _recursivelyExpandType(typeChecker: ts.TypeChecker, types: ts.Type[], ctx: RecursiveExpandContext): ts.Type {
    const { seen } = ctx
    
    ctx.depth++
    const res = expandType()
    ctx.depth--

    return res

    function expandType() {
        if(types.length > 0 && ctx.depth > ctx.maxDepth) {
            return types[0]
        }
    
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
        
                const unionTypeMembers = (type as ts.UnionType).types.map(t => _recursivelyExpandType(typeChecker, [t], ctx))
                newType.types = unionTypeMembers
            } else if(type.flags & ts.TypeFlags.Object) {
                if(getSignaturesOfType(typeChecker, type).length > 0) {
                    // function type
                    otherTypes.push(type)
                } else if(isTupleType(type)) {
                    const expandedTuple = createTupleType(type)
                    seen.set(type, expandedTuple)
                    expandedTuple.resolvedTypeArguments = typeChecker.getTypeArguments(type).map(
                        arg => _recursivelyExpandType(typeChecker, [arg], ctx)
                    )

                    otherTypes.push(expandedTuple)
                } else if(isArrayType(type)) {
                    const expandedArray = createArrayType(type)
                    seen.set(type, expandedArray)
                    expandedArray.resolvedTypeArguments = [_recursivelyExpandType(typeChecker, [typeChecker.getTypeArguments(type)[0]], ctx)]

                    otherTypes.push(expandedArray)
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
    
        // TODO: refactor this to be more flexible
        //       this process should probably be merged with up above instead
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
    }

    function createAnonymousObjectType() {
        return createObjectType(typeChecker, ts.ObjectFlags.Anonymous)
    }

    function createArrayType(array: ts.TypeReference): TypeReferenceInternal {
        const arrayType = createObjectType(typeChecker, ts.ObjectFlags.Reference) as unknown as TypeReferenceInternal
        arrayType.target = array.target
        return arrayType
    }

    function createTupleType(tuple: ts.TypeReference): TypeReferenceInternal {
        const tupleType = createObjectType(typeChecker, ts.ObjectFlags.Reference) as unknown as TypeReferenceInternal
        tupleType.target = tuple.target
        return tupleType
    }

    // TODO: move to using type.getProperties() on the intersection type
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
        let symbolFlags = ts.SymbolFlags.Property

        if(symbols.every(s => s.flags & ts.SymbolFlags.Optional)) {
            symbolFlags |= ts.SymbolFlags.Optional
        }

        const propertySymbol = createSymbol(symbolFlags, name, 1 << 18)

        const types = symbols.map(s => getSymbolType(typeChecker, s))
        
        propertySymbol.type = _recursivelyExpandType(typeChecker, types, ctx)

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