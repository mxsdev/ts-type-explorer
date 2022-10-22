import * as ts from "typescript"
import { SourceFileLocation, TypeId } from "./types"

export type SymbolName = ts.__String

type TypeConstructor = new (checker: ts.TypeChecker, flags: ts.TypeFlags) => ts.Type
type SymbolConstructor = new (flags: ts.SymbolFlags, name: SymbolName) => ts.Symbol

function getTypeConstructor() {
    // @ts-expect-error objectAllocator exists but is not exposed by types publicly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return ts.objectAllocator.getTypeConstructor() as TypeConstructor
}

function getSymbolConstructor() {
    // @ts-expect-error objectAllocator exists but is not exposed by types publicly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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

type TransientSymbol = ts.Symbol & { checkFlags: number }
type NodeWithTypeArguments = ts.Node & { typeArguments?: ts.NodeArray<ts.TypeNode> }
type NodeWithJsDoc = ts.Node & { jsDoc?: ts.Node[] | undefined }

export type UnionTypeInternal = ts.UnionType & { id: number }
export type IntersectionTypeInternal = ts.IntersectionType & { id: number }
export type TypeReferenceInternal = ts.TypeReference & { resolvedTypeArguments?: ts.Type[] }
export type SignatureInternal = ts.Signature & { minArgumentCount: number, resolvedMinArgumentCount?: number, target?: SignatureInternal }
export type IntrinsicTypeInternal = ts.Type & { intrinsicName: string, objectFlags: ts.ObjectFlags }

export type TSSymbol = ts.Symbol & {
    checkFlags: number,
    type?: ts.Type,
    parent?: TSSymbol,
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

    const fallbackType = typeChecker.getTypeOfSymbolAtLocation(symbol, { parent: {} } as unknown as ts.Node)
    return fallbackType
}

export function getNodeSymbol(typeChecker: ts.TypeChecker, node?: ts.Node): ts.Symbol|undefined {
    return node ? ((node as ts.Node & { symbol?: TSSymbol }).symbol ?? typeChecker.getSymbolAtLocation(node)) : undefined
}

export function getNodeType(typeChecker: ts.TypeChecker, node: ts.Node) {
    const nodeType = typeChecker.getTypeAtLocation(node)
    if(isValidType(nodeType)) return nodeType

    const symbolType = wrapSafe((symbol: ts.Symbol) => getSymbolType(typeChecker, symbol, node))(getNodeSymbol(typeChecker, node))
    if(symbolType && isValidType(symbolType)) return symbolType

    if(ts.isTypeNode(node) || ts.isTypeNode(node.parent)) {
        const typeNode = ts.isTypeNode(node) ? node : ts.isTypeNode(node.parent) ? node.parent : undefined as never

        const typeNodeType = getTypeFromTypeNode(typeChecker, typeNode)
        if(isValidType(typeNodeType)) return typeNodeType
    }

    if((ts as (typeof ts & { isExpression(node: ts.Node): node is ts.Expression })).isExpression(node)) {
        const expressionType = checkExpression(typeChecker, node)
        if(expressionType && isValidType(expressionType)) return expressionType
    }

    return undefined
}

/**
 * Hack to call typeChecker.checkExpression externally
 */
export function checkExpression(typeChecker: ts.TypeChecker, node: ts.Node) {
    const symbol = createSymbol(ts.SymbolFlags.BlockScopedVariable, "type" as ts.__String)
    const declaration = {
        kind: ts.SyntaxKind.VariableDeclaration,
        flags: ts.NodeFlags.JavaScriptFile,
        type: {
            kind: ts.SyntaxKind.LiteralType,
            literal: node,
            parent: {
                kind: ts.SyntaxKind.VariableStatement,
            },
        },
        parent: {
            parent: {
                kind: 0
            }
        }
    } as unknown as ts.Declaration
    symbol.valueDeclaration = declaration

    const type = typeChecker.getTypeOfSymbolAtLocation(symbol, { parent: {} } as unknown as ts.Node)
    return isValidType(type) ? type : undefined
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

    if(indexInfos.length === 0 && (type.flags & ts.TypeFlags.Object) && ((type as ObjectType).objectFlags & ts.ObjectFlags.Mapped) && !((type as ObjectType).objectFlags & ts.ObjectFlags.Instantiated)) {
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

export function wrapSafe<T, Args extends Array<unknown>, Return>(wrapped: (arg1: T, ...args: Args) => Return): (arg1: T|undefined, ...args: Args) => Return|undefined {
    return (arg1, ...args) => arg1 === undefined ? arg1 as undefined : wrapped(arg1, ...args)
}

export function isNonEmpty<T>(arr: readonly T[]|undefined): arr is readonly T[] {
    return !!arr && arr.length > 0
}

export function isEmpty<T>(arr: readonly T[]|undefined): arr is undefined {
    return !isNonEmpty<T>(arr)
}

export function arrayContentsEqual(x: readonly unknown[], y: readonly unknown[]) {
    return (x.length === y.length && x.every((el, i) => y[i] == el))
}

export function filterUndefined<T>(arr: T[]): Exclude<T, undefined>[] {
    return arr.filter(x => x !== undefined) as Exclude<T, undefined>[]
}

export function getTypeId(type: ts.Type, symbol?: ts.Symbol, node?: ts.Node): TypeId {
    const ids: (number|undefined)[] = [
        (type as ts.Type & { id: number })?.id,
        (symbol as ts.Symbol & { id?: number })?.id,
        (node as ts.Node & { id?: number })?.id
    ]

    return ids.map(x => x === undefined ? "" : x.toString()).join(",")
}

export function getEmptyTypeId(): TypeId {
    return ""
}

export function isPureObject(typeChecker: ts.TypeChecker, type: ts.Type): type is ts.ObjectType {
    return (
            !!(type.flags & ts.TypeFlags.Object) 
            && (getSignaturesOfType(typeChecker, type).length === 0) 
            && (getIndexInfos(typeChecker, type).length === 0)
            && !(isArrayType(type))
            && !(isTupleType(type))
        ) || (!!(type.flags & ts.TypeFlags.Intersection) && (type as ts.IntersectionType).types.every(t => isPureObject(typeChecker, t)))
}

export function getIntersectionTypesFlat(...types: ts.Type[]): ts.Type[] {
    return types.flatMap((type) => (type.flags & ts.TypeFlags.Intersection) ? (type as ts.IntersectionType).types : [type])
}

export function isInterfaceType(type: ts.Type): type is ts.InterfaceType {
    return !!(getObjectFlags(type) & ts.ObjectFlags.Interface)
}

export function isClassType(type: ts.Type): type is ts.InterfaceType {
    return !!(getObjectFlags(type) & ts.ObjectFlags.Class)
}

export function isClassOrInterfaceType(type: ts.Type): type is ts.InterfaceType {
    return !!(getObjectFlags(type) & ts.ObjectFlags.ClassOrInterface)
}

export function isArrayType(type: ts.Type): type is ts.TypeReference {
    return !!(isObjectReference(type)) 
        && (type.target.getSymbol()?.getName() === "Array")
        // && getTypeArguments(typeChecker, type).length >= 1
}

export function isTupleType(type: ts.Type): type is ts.TypeReference {
    return !!(isObjectReference(type) && (type.target.objectFlags & ts.ObjectFlags.Tuple))
}

export function isObjectReference(type: ts.Type): type is ts.TypeReference {
    return !!(getObjectFlags(type) & ts.ObjectFlags.Reference)
}

export function getTypeFromTypeNode(typeChecker: ts.TypeChecker, node: ts.TypeNode) {
    if(!(node.flags & ts.NodeFlags.Synthesized)) {
        return typeChecker.getTypeFromTypeNode(node)
    } else {
        return typeChecker.getTypeFromTypeNode({
            ...node, flags: node.flags & ~ts.NodeFlags.Synthesized, parent: node.parent ?? { kind: ts.SyntaxKind.VariableStatement } as ts.Node
        })
    }
}

export function getTypeArguments<T extends ts.Type>(typeChecker: ts.TypeChecker, type: T, node?: ts.Node): (readonly ts.Type[])|undefined  {
    const typeArgumentsOfType = isObjectReference(type) ? typeChecker.getTypeArguments(type) : undefined

    if(node && isEmpty(typeArgumentsOfType)) {
        const typeArgumentDefinitions = (node as NodeWithTypeArguments).typeArguments ?? (node.parent as NodeWithTypeArguments)?.typeArguments
        const typeArgumentsOfNode = wrapSafe(filterUndefined)(typeArgumentDefinitions?.map((node) => getTypeFromTypeNode(typeChecker, node)))

        if(typeArgumentsOfNode?.length === typeArgumentDefinitions?.length) {
            return typeArgumentsOfNode
        }
    }

    return typeArgumentsOfType
}

export function getTypeParameters(typeChecker: ts.TypeChecker, type: ts.Type, symbol?: ts.Symbol): (readonly ts.Type[])|undefined {
    if(isClassOrInterfaceType(type)) {
        return type.typeParameters
    } else if(symbol && symbol.declarations && symbol.declarations.length === 1) {
        const typeParameterDeclarations = (symbol.declarations[0] as ts.Declaration & { typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration> }).typeParameters ?? typeChecker.symbolToTypeParameterDeclarations(symbol, undefined, undefined)
        if(isEmpty(typeParameterDeclarations)) return undefined

        const typeParameterTypes: ts.Type[] = filterUndefined(
            typeParameterDeclarations.map(decl => getNodeType(typeChecker, decl))
        )

        if(typeParameterDeclarations.length === typeParameterTypes.length) {
            return typeParameterTypes
        }
    }

    return undefined
}

export function getObjectFlags(type: ts.Type): number {
    return (type.flags & ts.TypeFlags.Object) && (type as ObjectType).objectFlags
}

type ParameterInfo = {
    optional?: boolean,
    isRest?: boolean
}    

export function getParameterInfo(typeChecker: ts.TypeChecker, parameter: ts.Symbol, signature?: ts.Signature): ParameterInfo {
    const parameterDeclaration = typeChecker.symbolToParameterDeclaration(parameter, signature?.getDeclaration(), undefined)
    const baseParameterDeclaration = parameter.getDeclarations()?.find((x) => x.kind && ts.SyntaxKind.Parameter) as ts.ParameterDeclaration|undefined
    
    if(parameterDeclaration) {
        return {
            optional: !!parameterDeclaration.questionToken,
            isRest: !!parameterDeclaration.dotDotDotToken
        }
    }
    
    return {
        optional: !!(baseParameterDeclaration && typeChecker.isOptionalParameter(baseParameterDeclaration) || getCheckFlags(parameter) & CheckFlags.OptionalParameter),
        isRest: !!(baseParameterDeclaration && baseParameterDeclaration.dotDotDotToken || getCheckFlags(parameter) & CheckFlags.RestParameter),
    }
}

export function getCheckFlags(symbol: ts.Symbol): CheckFlags {
    return symbol.flags & ts.SymbolFlags.Transient ? (symbol as TransientSymbol).checkFlags : 0;
}

export function pseudoBigIntToString(value: ts.PseudoBigInt) {
    return (value.negative ? "-" : "") + value.base10Value
}

export function getImplementsTypes(typeChecker: ts.TypeChecker, type: ts.InterfaceType): ts.BaseType[] {
    const resolvedImplementsTypes: ts.BaseType[] = []

    if (type.symbol?.declarations) {
        for (const declaration of type.symbol.declarations) {
            const implementsTypeNodes = getEffectiveImplementsTypeNodes(declaration as ts.ClassLikeDeclaration);
            if (!implementsTypeNodes) continue;
            for (const node of implementsTypeNodes) {
                const implementsType = getTypeFromTypeNode(typeChecker, node);
                if (isValidType(implementsType)) {
                    resolvedImplementsTypes.push(implementsType);
                }
            }
        }
    }
    return resolvedImplementsTypes;
}

function isInJSFile(node: ts.Node | undefined): boolean {
    return !!node && !!(node.flags & ts.NodeFlags.JavaScriptFile);
}

function getEffectiveImplementsTypeNodes(node: ts.ClassLikeDeclaration): undefined | readonly ts.ExpressionWithTypeArguments[]{
    if (isInJSFile(node)) {
        return getJSDocImplementsTags(node).map(n => n.class);
    }
    else {
        const heritageClause = getHeritageClause(node.heritageClauses, ts.SyntaxKind.ImplementsKeyword);
        return heritageClause?.types;
    }
}

function getJSDocImplementsTags(node: ts.Node): readonly ts.JSDocImplementsTag[] {
    return ts.getAllJSDocTags(node, isJSDocImplementsTag);
}

function isJSDocImplementsTag(node: ts.Node): node is ts.JSDocImplementsTag {
    return node.kind === ts.SyntaxKind.JSDocImplementsTag;
}

function getHeritageClause(clauses: ts.NodeArray<ts.HeritageClause> | undefined, kind: ts.SyntaxKind) {
    if (clauses) {
        for (const clause of clauses) {
            if (clause.token === kind) {
                return clause;
            }
        }
    }

    return undefined;
}

export function getConstructSignatures(typeChecker: ts.TypeChecker, type: ts.InterfaceType): readonly ts.Signature[] {
    const symbol = type.getSymbol()

    if(symbol && symbol.flags & ts.SymbolFlags.Class) {
        const classType = getSymbolType(typeChecker, symbol)
        return classType.getConstructSignatures()
    }

    return []
}

export function getCallLikeExpression(node: ts.Node) {
    return ts.isCallLikeExpression(node) ? node : ts.isCallLikeExpression(node.parent) ? node.parent : undefined
}

export function getResolvedSignature(typeChecker: ts.TypeChecker, node?: ts.Node): SignatureInternal|undefined {
    if(!node) return undefined

    const callExpression = getCallLikeExpression(node)

    return callExpression ? typeChecker.getResolvedSignature(callExpression) as SignatureInternal : undefined
}

export function getSignatureTypeArguments(typeChecker: ts.TypeChecker, signature: ts.Signature, enclosingDeclaration?: ts.Node) {
    return typeChecker.signatureToSignatureDeclaration(signature, ts.SyntaxKind.CallSignature, enclosingDeclaration, ts.NodeBuilderFlags.WriteTypeArgumentsOfSignature)
        ?.typeArguments?.map(t => getTypeFromTypeNode(typeChecker, t))
}

export function getDescendantAtPosition(sourceFile: ts.SourceFile, position: number) {
    return getDescendantAtRange(sourceFile, [position, position])
}

export function getDescendantAtRange(sourceFile: ts.SourceFile, range: [number, number]) {
    let bestMatch: { node: ts.Node; start: number } = { node: sourceFile, start: sourceFile.getStart(sourceFile) };
    searchDescendants(sourceFile);
    return bestMatch.node;
  
    function searchDescendants(node: ts.Node) {
      const children: ts.Node[] = []
      node.forEachChild(child => { children.push(child); return undefined })
    // const children = node.getChildren(sourcefile)

      for (const child of children) {
        if (child.kind !== ts.SyntaxKind.SyntaxList) {
          if (isBeforeRange(child.end)) {
            continue;
          }
  
          const childStart = getStartSafe(child, sourceFile);
  
          if (isAfterRange(childStart)) {
            return;
          }
  
          const isEndOfFileToken = child.kind === ts.SyntaxKind.EndOfFileToken;
          const hasSameStart = bestMatch.start === childStart && range[0] === childStart;
          if (!isEndOfFileToken && !hasSameStart) {
            bestMatch = { node: child, start: childStart };
          }
        }
  
        searchDescendants(child);
      }
    }
  
    function isBeforeRange(pos: number) {
        return pos < range[0];
    }
  
    function isAfterRange(nodeEnd: number) {
        return nodeEnd >= range[0] && nodeEnd > range[1];
    }
}

function getStartSafe(node: ts.Node, sourceFile: ts.SourceFile) {
    // workaround for compiler api bug with getStart(sourceFile, true) (see PR #35029 in typescript repo)
    const jsDocs = (node as NodeWithJsDoc).jsDoc
    if (jsDocs && jsDocs.length > 0) {
      return jsDocs[0].getStart(sourceFile);
    }
    return node.getStart(sourceFile);
  }

export function getSourceFileLocation(sourceFile: ts.SourceFile, node: ts.Node): SourceFileLocation|undefined {
    const startPos = node.getStart()
    const endPos = node.getEnd()

    if(startPos < 0 || endPos < 0) {
        return undefined
    }

    const start = sourceFile.getLineAndCharacterOfPosition(startPos)
    const end   = sourceFile.getLineAndCharacterOfPosition(endPos)

    return {
        fileName: sourceFile.fileName,
        range: {
            start, end
        }
    }
}


export const enum CheckFlags {
    Instantiated      = 1 << 0,         // Instantiated symbol
    SyntheticProperty = 1 << 1,         // Property in union or intersection type
    SyntheticMethod   = 1 << 2,         // Method in union or intersection type
    Readonly          = 1 << 3,         // Readonly transient symbol
    ReadPartial       = 1 << 4,         // Synthetic property present in some but not all constituents
    WritePartial      = 1 << 5,         // Synthetic property present in some but only satisfied by an index signature in others
    HasNonUniformType = 1 << 6,         // Synthetic property with non-uniform type in constituents
    HasLiteralType    = 1 << 7,         // Synthetic property with at least one literal type in constituents
    ContainsPublic    = 1 << 8,         // Synthetic property with public constituent(s)
    ContainsProtected = 1 << 9,         // Synthetic property with protected constituent(s)
    ContainsPrivate   = 1 << 10,        // Synthetic property with private constituent(s)
    ContainsStatic    = 1 << 11,        // Synthetic property with static constituent(s)
    Late              = 1 << 12,        // Late-bound symbol for a computed property with a dynamic name
    ReverseMapped     = 1 << 13,        // Property of reverse-inferred homomorphic mapped type
    OptionalParameter = 1 << 14,        // Optional parameter
    RestParameter     = 1 << 15,        // Rest parameter
    DeferredType      = 1 << 16,        // Calculation of the type of this symbol is deferred due to processing costs, should be fetched with `getTypeOfSymbolWithDeferredType`
    HasNeverType      = 1 << 17,        // Synthetic property with at least one never type in constituents
    Mapped            = 1 << 18,        // Property of mapped type
    StripOptional     = 1 << 19,        // Strip optionality in mapped property
    Unresolved        = 1 << 20,        // Unresolved type alias symbol
    Synthetic = SyntheticProperty | SyntheticMethod,
    Discriminant = HasNonUniformType | HasLiteralType,
    Partial = ReadPartial | WritePartial
}