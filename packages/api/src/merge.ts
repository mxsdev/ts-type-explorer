import * as ts from "typescript"
import { APIConfig } from "./config"
import {
    createUnionType,
    createIntersectionType,
    createObjectType,
    TSSymbol,
    createSymbol,
    getSymbolType,
    SymbolName,
    ObjectType,
    getSignaturesOfType,
    getIndexInfos,
    getIntersectionTypesFlat,
    isArrayType,
    isTupleType,
    TypeReferenceInternal,
    isPureObject,
    CheckFlags,
} from "./util"

export function recursivelyExpandType(
    typeChecker: ts.TypeChecker,
    type: ts.Type,
    config?: APIConfig
) {
    config ??= new APIConfig()

    return _recursivelyExpandType(typeChecker, [type], {
        seen: new WeakMap(),
        maxDepth: config.maxDepth,
        depth: 0,
    })
}

type RecursiveExpandContext = {
    seen: WeakMap<ts.Type, ts.Type>
    depth: number
    maxDepth: number
}

function _recursivelyExpandType(
    typeChecker: ts.TypeChecker,
    types: ts.Type[],
    ctx: RecursiveExpandContext
): ts.Type {
    const { seen } = ctx

    ctx.depth++
    const res = expandType()
    ctx.depth--

    return res

    function expandType() {
        if (types.length > 0 && ctx.depth > ctx.maxDepth) {
            return types[0]
        }

        if (types.length === 1 && seen.has(types[0])) {
            return seen.get(types[0])!
        }

        function processType(type: ts.Type): ts.Type[] {
            if (type.flags & ts.TypeFlags.Intersection) {
                return getIntersectionTypesFlat(type).flatMap(processType)
            } else if (type.flags & ts.TypeFlags.Union) {
                const newType = createUnionType(typeChecker)
                seen.set(type, newType)

                const unionTypeMembers = (type as ts.UnionType).types.map((t) =>
                    _recursivelyExpandType(typeChecker, [t], ctx)
                )
                newType.types = unionTypeMembers

                return [newType]
            } else if (type.flags & ts.TypeFlags.Object) {
                if (getSignaturesOfType(typeChecker, type).length > 0) {
                    // function type
                    return [type]
                } else if (isTupleType(type)) {
                    const expandedTuple = createTupleType(type)
                    seen.set(type, expandedTuple)
                    expandedTuple.resolvedTypeArguments = typeChecker
                        .getTypeArguments(type)
                        .map((arg) =>
                            _recursivelyExpandType(typeChecker, [arg], ctx)
                        )

                    return [expandedTuple]
                } else if (isArrayType(type)) {
                    const expandedArray = createArrayType(type)
                    seen.set(type, expandedArray)
                    expandedArray.resolvedTypeArguments = [
                        _recursivelyExpandType(
                            typeChecker,
                            [typeChecker.getTypeArguments(type)[0]],
                            ctx
                        ),
                    ]

                    return [expandedArray]
                } else if (getIndexInfos(typeChecker, type).length > 0) {
                    // mapped type
                    return [type]
                } else {
                    const objectType = createAnonymousObjectType()
                    seen.set(type, objectType)

                    recursiveMergeObjectIntersection(
                        [type as ts.ObjectType],
                        objectType
                    )

                    return [objectType]
                }
            } else {
                return [type]
            }
        }

        const processedTypes = types.flatMap(processType).map(removeTypeAlias)

        if (processedTypes.length === 1) {
            if (types.length === 1) seen.set(types[0], processedTypes[0])
            return processedTypes[0]
        } else {
            const objectTypes: ts.ObjectType[] = []
            const nonObjectTypes: ts.Type[] = []

            processedTypes.forEach((t) =>
                isPureObject(typeChecker, t)
                    ? objectTypes.push(t)
                    : nonObjectTypes.push(t)
            )

            let objectType: ObjectType | undefined
            if (objectTypes.length > 0) {
                objectType = createAnonymousObjectType()
                if (nonObjectTypes.length === 0) seen.set(types[0], objectType)

                recursiveMergeObjectIntersection(objectTypes, objectType)
            }

            if (nonObjectTypes.length === 0 && objectType) {
                return objectType
            } else {
                const newType = createIntersectionType(typeChecker)
                if (types.length === 1) seen.set(types[0], newType)

                newType.types = [
                    ...(objectType ? [objectType] : []),
                    ...nonObjectTypes,
                ]

                return newType
            }
        }
    }

    function createAnonymousObjectType() {
        return createObjectType(typeChecker, ts.ObjectFlags.Anonymous)
    }

    function createArrayType(array: ts.TypeReference): TypeReferenceInternal {
        const arrayType = createObjectType(
            typeChecker,
            ts.ObjectFlags.Reference
        ) as unknown as TypeReferenceInternal
        arrayType.target = array.target
        return arrayType
    }

    function createTupleType(tuple: ts.TypeReference): TypeReferenceInternal {
        const tupleType = createObjectType(
            typeChecker,
            ts.ObjectFlags.Reference
        ) as unknown as TypeReferenceInternal
        tupleType.target = tuple.target
        return tupleType
    }

    // TODO: move to using type.getProperties() on the intersection type
    function recursiveMergeObjectIntersection(
        types: ts.ObjectType[],
        newType?: ObjectType
    ) {
        newType ||= createAnonymousObjectType()
        const nameToSymbols = new Map<SymbolName, TSSymbol[]>()

        types.forEach((t) => {
            t.getProperties().forEach((s) => {
                const name = s.getEscapedName()

                if (!nameToSymbols.has(name)) {
                    nameToSymbols.set(name, [])
                }

                nameToSymbols.get(name)!.push(s as TSSymbol)
            })
        })

        for (const [name, symbols] of nameToSymbols) {
            newType.properties.push(
                mergeIntersectedPropertySymbols(symbols, name)
            )
        }

        return newType
    }

    function mergeIntersectedPropertySymbols(
        symbols: TSSymbol[],
        name: SymbolName
    ): TSSymbol {
        let symbolFlags = ts.SymbolFlags.Property

        if (symbols.every((s) => s.flags & ts.SymbolFlags.Optional)) {
            symbolFlags |= ts.SymbolFlags.Optional
        }

        const propertySymbol = createSymbol(
            symbolFlags,
            name,
            CheckFlags.Mapped
        )

        const types = symbols.map((s) => getSymbolType(typeChecker, s))

        propertySymbol.type = _recursivelyExpandType(typeChecker, types, ctx)

        return propertySymbol
    }

    function removeTypeAlias(type: ts.Type) {
        const symbol = type.getSymbol()

        if (type.aliasSymbol && symbol) {
            type = cloneClassInstance(type)
            // remove type alias
            type.aliasSymbol = undefined
        }

        return type
    }
}

function cloneClassInstance<T>(orig: T): T {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.assign(Object.create(Object.getPrototypeOf(orig)), orig) as T
}
