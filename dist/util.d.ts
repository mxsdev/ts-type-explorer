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
export declare function getSymbolType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node): ts.Type;
export declare function createType(checker: ts.TypeChecker, flags: ts.TypeFlags): ts.Type;
export declare function createObjectType(typeChecker: ts.TypeChecker, objectFlags: ts.ObjectFlags, flags?: ts.TypeFlags): ObjectType;
export declare function createUnionType(typeChecker: ts.TypeChecker, types?: ts.Type[], flags?: ts.TypeFlags): UnionType;
export declare function createIntersectionType(typeChecker: ts.TypeChecker, types?: ts.Type[], flags?: ts.TypeFlags): IntersectionType;
export declare function createSymbol(flags: ts.SymbolFlags, name: SymbolName, checkFlags?: number): TSSymbol;
export declare function getTypeOrDeclaredType(typeChecker: ts.TypeChecker, symbol: ts.Symbol, location?: ts.Node): ts.Type;
export declare function resolvedTypeToString(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, ...args: (Parameters<ts.TypeChecker['typeToString']>)): string;
