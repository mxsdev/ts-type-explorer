import type * as ts from "typescript"

export type TextRange = {
    start: ts.LineAndCharacter
    end: ts.LineAndCharacter
}

export type SourceFileLocation = {
    range: TextRange
    fileName: string
}

export type DeclarationInfo = {
    location: SourceFileLocation
}

export type SymbolInfo = {
    name: string
    flags: number
    optional?: boolean
    anonymous?: boolean
    rest?: boolean
    insideClassOrInterface?: boolean
    declarations?: DeclarationInfo[]
}

export type IndexInfo = {
    keyType?: TypeInfo
    type?: TypeInfo
    parameterSymbol?: SymbolInfo
    parameterType?: TypeInfo
    // parameterName?: string
}

export type SignatureInfo = {
    symbolMeta?: SymbolInfo
    parameters: TypeInfo[]
    returnType?: TypeInfo
    // minArgumentCount: number,
    typeParameters?: TypeInfo[]
}

export type TypeParameterInfo = {
    name: string
}

export type TypeInfo = TypeInfoNoId & { id: TypeId }

export type TypeInfoNoId = {
    symbolMeta?: SymbolInfo
    aliasSymbolMeta?: SymbolInfo
    typeArguments?: TypeInfo[]
    typeParameters?: TypeInfo[]
} & (
    | {
          kind: "primitive"
          primitive:
              | "any"
              | "unknown"
              | "string"
              | "number"
              | "boolean"
              | "bigint"
              | "essymbol"
              | "unique_symbol"
              | "null"
              | "never"
              | "undefined"
              | "void"
      }
    | { kind: "enum"; properties?: TypeInfo[] }
    | { kind: "reference"; location?: SourceFileLocation }
    | { kind: "string_literal"; value: string }
    | { kind: "number_literal"; value: number }
    | { kind: "boolean_literal"; value: boolean }
    | {
          kind: "enum_literal"
          literalSymbol: SymbolInfo
          parentSymbol?: SymbolInfo
          value: string
      }
    | { kind: "bigint_literal"; value: ts.PseudoBigInt }
    | {
          kind: "type_parameter"
          baseConstraint?: TypeInfo
          defaultType?: TypeInfo
          typeSymbolMeta?: SymbolInfo
      }
    | {
          kind: "object"
          properties: TypeInfo[]
          indexInfos?: IndexInfo[]
          objectClass?: TypeInfo
      }
    | {
          kind: "interface" | "class"
          properties: TypeInfo[]
          baseType?: TypeInfo
          implementsTypes?: TypeInfo[]
          // typeParameters?: TypeInfo[],
          constructSignatures?: SignatureInfo[]
          classSymbol?: SymbolInfo
      }
    | { kind: "function"; signatures: SignatureInfo[] }
    | { kind: "array"; type: TypeInfo }
    | { kind: "tuple"; types: TypeInfo[]; names?: string[] }
    | {
          kind: "union"
          types: TypeInfo[]
      }
    | {
          kind: "intersection"
          properties: TypeInfo[]
          types: TypeInfo[]
      }
    | {
          kind: "index"
          keyOf: TypeInfo
      }
    | {
          kind: "indexed_access"
          indexType: TypeInfo
          objectType: TypeInfo
      }
    | {
          kind: "conditional"
          checkType: TypeInfo
          extendsType: TypeInfo
          trueType?: TypeInfo
          falseType?: TypeInfo
      }
    | {
          kind: "substitution"
          baseType: TypeInfo
          substitute: TypeInfo
      }
    | { kind: "non_primitive" }
    | { kind: "intrinsic" }
    | {
          kind: "template_literal"
          texts: readonly string[]
          types: TypeInfo[]
      }
    | {
          kind: "string_mapping"
          typeSymbol: SymbolInfo
          type: TypeInfo
      }
    | {
          kind: "max_depth"
      }
)

export type TypeId = string

export type TypeInfoKind<K extends TypeInfo["kind"]> = Extract<
    TypeInfo,
    { kind: K }
>
