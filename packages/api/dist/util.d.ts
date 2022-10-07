import ts from "typescript";
export declare type SymbolName = ts.__String;
export declare type ObjectType = ts.ObjectType & {
    id: number;
    members: ts.SymbolTable;
    properties: ts.Symbol[];
    indexInfos: ts.IndexInfo[];
    constructSignatures: ts.Signature[];
    callSignatures: ts.Signature[];
};
export declare type UnionType = ts.UnionType & {
    id: number;
};
export declare type IntersectionType = ts.IntersectionType & {
    id: number;
};
export declare type TSSymbol = ts.Symbol & {
    checkFlags: number;
    type?: ts.Type;
};
export declare function isValidType(type: ts.Type): boolean;
export declare function getSymbolDeclaration(symbol?: ts.Symbol): ts.Declaration | undefined;
export declare function getSymbolType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node): ts.Type;
export declare function getSignaturesOfType(typeChecker: ts.TypeChecker, type: ts.Type): ts.Signature[];
export declare function getIndexInfos(typeChecker: ts.TypeChecker, type: ts.Type): readonly ts.IndexInfo[];
export declare function createType(checker: ts.TypeChecker, flags: ts.TypeFlags): ts.Type;
export declare function createObjectType(typeChecker: ts.TypeChecker, objectFlags: ts.ObjectFlags, flags?: ts.TypeFlags): ObjectType;
export declare function createUnionType(typeChecker: ts.TypeChecker, types?: ts.Type[], flags?: ts.TypeFlags): UnionType;
export declare function createIntersectionType(typeChecker: ts.TypeChecker, types?: ts.Type[], flags?: ts.TypeFlags): IntersectionType;
export declare function createSymbol(flags: ts.SymbolFlags, name: SymbolName, checkFlags?: number): TSSymbol;
export declare function multilineTypeToString(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, type: ts.Type, enclosingDeclaration?: ts.Node, flags?: ts.NodeBuilderFlags): string;
