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

export type UnionTypeInternal = ts.UnionType & { id: number }
export type IntersectionTypeInternal = ts.IntersectionType & { id: number }
export type TypeReferenceInternal = ts.TypeReference & { resolvedTypeArguments?: ts.Type[] }

export type TSSymbol = ts.Symbol & {
    checkFlags: number,
    type?: ts.Type,
}

export function isValidType(type: ts.Type): boolean {
    return (
        !('intrinsicName' in type) ||
        (type as unknown as { intrinsicName: string }).intrinsicName !== 'error'
    );
};

export function getSymbolDeclaration(
    symbol?: ts.Symbol,
): ts.Declaration | undefined {
    return symbol
        ? symbol.valueDeclaration || symbol.declarations?.[0]
        : undefined;
};

export function getSymbolType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node) {
    if(location) {
        const type = typeChecker.getTypeOfSymbolAtLocation(symbol, location)

        if(isValidType(type)) {
            return type
        }
    }

    const declaration = getSymbolDeclaration(symbol);
    if (declaration) {
      const type = typeChecker.getTypeOfSymbolAtLocation(symbol, declaration);
      if (isValidType(type)) {
        return type
      }
    }

    const symbolType = typeChecker.getDeclaredTypeOfSymbol(symbol);
    if (isValidType(symbolType)) {
      return symbolType;
    }

    return typeChecker.getTypeOfSymbolAtLocation(symbol, { parent: {} } as unknown as ts.Node)
}

export function getSignaturesOfType(typeChecker: ts.TypeChecker, type: ts.Type) {
    return [
        ...typeChecker.getSignaturesOfType(type, ts.SignatureKind.Call),
        ...typeChecker.getSignaturesOfType(type, ts.SignatureKind.Construct),
    ]
}

export type TSIndexInfoMerged = { declaration?: ts.MappedTypeNode|ts.IndexSignatureDeclaration, keyType?: ts.Type, type?: ts.Type, parameterType?: ts.Type }
interface MappedType extends ts.Type {
    declaration: ts.MappedTypeNode;
    typeParameter?: ts.TypeParameter;
    constraintType?: ts.Type;
    // nameType?: ts.Type;
    templateType?: ts.Type;
    modifiersType?: ts.Type;
    // resolvedApparentType?: ts.Type;
    // containsError?: boolean;
}

export function getIndexInfos(typeChecker: ts.TypeChecker, type: ts.Type) {
    const indexInfos: TSIndexInfoMerged[] = [ ...typeChecker.getIndexInfosOfType(type) ]

    if((type.flags & ts.TypeFlags.Object) && ((type as ObjectType).objectFlags & ts.ObjectFlags.Mapped) && !((type as ObjectType).objectFlags & ts.ObjectFlags.Instantiated)) {
        const mappedType = type as MappedType

        if(mappedType.typeParameter) {
            indexInfos.push({ keyType: mappedType.constraintType,
                type: mappedType.templateType,
                parameterType: mappedType.typeParameter,
                declaration: mappedType.declaration
            })
        }

    }

    return indexInfos
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

export function createUnionType(typeChecker: ts.TypeChecker, types: ts.Type[] = [], flags: ts.TypeFlags = 0): UnionTypeInternal { 
    const type = createType(typeChecker, flags | ts.TypeFlags.Union) as UnionTypeInternal

    type.types = types

    return type
}

export function createIntersectionType(typeChecker: ts.TypeChecker, types: ts.Type[] = [], flags: ts.TypeFlags = 0): IntersectionTypeInternal { 
    const type = createType(typeChecker, flags | ts.TypeFlags.Intersection) as IntersectionTypeInternal

    type.types = types

    return type
}

export function createSymbol(flags: ts.SymbolFlags, name: SymbolName, checkFlags?: number) {
    const symbol = (new (getSymbolConstructor())(flags | ts.SymbolFlags.Transient, name) as TSSymbol);
    symbol.checkFlags = checkFlags || 0;
    return symbol;
}

export function multilineTypeToString(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, type: ts.Type, enclosingDeclaration?: ts.Node, flags: ts.NodeBuilderFlags = 0) {
    const typeNode = typeChecker.typeToTypeNode(type, enclosingDeclaration, flags)
    if(!typeNode) return ""

    const printer = ts.createPrinter()
    return printer.printNode(ts.EmitHint.Unspecified, typeNode, sourceFile)
}

export function wrapSafe<T, Args extends Array<any>, Return>(wrapped: (arg1: T, ...args: Args) => Return): (arg1: T|undefined, ...args: Args) => Return|undefined {
    return (arg1, ...args) => arg1 === undefined ? arg1 as undefined : wrapped(arg1, ...args)
  }

export function getTypeId(type: ts.Type) {
    return (type as ts.Type & {id: number}).id
}

// TODO: test for array type, tuple type
export function isPureObject(typeChecker: ts.TypeChecker, type: ts.Type): boolean {
    return (!!(type.flags & ts.TypeFlags.Object) 
        && (getSignaturesOfType(typeChecker, type).length === 0) 
        && (getIndexInfos(typeChecker, type).length === 0))
        || (!!(type.flags & ts.TypeFlags.Intersection) && (type as ts.IntersectionType).types.every(t => isPureObject(typeChecker, t)))
}

export function getIntersectionTypesFlat(...types: ts.Type[]): ts.Type[] {
    return types.flatMap((type) => (type.flags & ts.TypeFlags.Intersection) ? (type as ts.IntersectionType).types : [type])
}

export function isArrayType(type: ts.Type): type is ts.TypeReference {
    return !!(getObjectFlags(type) & ts.ObjectFlags.Reference) 
        && ((type as ts.TypeReference).target.getSymbol()?.getName() === "Array")
        // && getTypeArguments(typeChecker, type).length >= 1
}

export function isTupleType(type: ts.Type): type is ts.TypeReference {
    return !!((getObjectFlags(type) & ts.ObjectFlags.Reference) && ((type as ts.TypeReference).target.objectFlags & ts.ObjectFlags.Tuple))
}

export function getTypeArguments(typeChecker: ts.TypeChecker, type: ts.TypeReference) {
    return typeChecker.getTypeArguments(type)
}

export function getObjectFlags(type: ts.Type): number {
    return (type.flags & ts.TypeFlags.Object) && (type as ObjectType).objectFlags
}