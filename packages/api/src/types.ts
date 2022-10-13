import ts from "typescript"

// TODO: support class instances with generics, like Map<string, number>
// TODO: support classes in general as separate tree types

export type SymbolInfo = {
    name: string,
    flags: number,
    optional?: boolean,
    anonymous?: boolean,
    rest?: boolean
}

export type IndexInfo = {
    keyType?: TypeInfo,
    type?: TypeInfo,
    parameterSymbol?: SymbolInfo
    // parameterName?: string
}

// export type FunctionParameterInfo = {
//     type: TypeInfo,
//     optional?: boolean
// }

export type SignatureInfo = {
    symbolMeta?: SymbolInfo,
    parameters: TypeInfo[],
    returnType: TypeInfo,
    // minArgumentCount: number,
}

export type TypeParameterInfo = {
    name: string,
}

export type TypeInfo = TypeInfoNoId & { id: TypeId }

// TODO: support ambient type parameters

export type TypeInfoNoId = 
    ({
        symbolMeta?: SymbolInfo,
        aliasSymbolMeta?: SymbolInfo,
    } & (
    |{
        kind: 'primitive',
        primitive: 'any'|'unknown'|'string'|'number'|'boolean'|'bigint'|'essymbol'|'unique_symbol'|'null'|'never'|'undefined'|'void'
    }
    |{ kind: 'enum', properties?: TypeInfo[] }
    |{ kind: 'reference' }
    |{ kind: 'string_literal', value: string, }
    |{ kind: 'number_literal', value: number, }
    |{ kind: 'boolean_literal', value: boolean }
    |{ kind: 'enum_literal', symbol: SymbolInfo, parentSymbol?: SymbolInfo, value: string }
    |{ kind: 'bigint_literal', value: ts.PseudoBigInt }
    |{ 
        kind: 'type_parameter',
        baseConstraint?: TypeInfo,
        defaultType?: TypeInfo,
    }
    |{
        kind: 'object',
        properties: TypeInfo[],
        indexInfos?: IndexInfo[],
    }
    |{ kind: 'function', signatures: SignatureInfo[] }
    |{ kind: 'array', type: TypeInfo }
    |{ kind: 'tuple', types: TypeInfo[], names?: string[] }
    |{
        kind: 'union',
        types: TypeInfo[],
    }
    |{
        kind: 'intersection',
        properties: TypeInfo[],
        types: TypeInfo[]
    }
    |{
        kind: 'index',
        keyOf: TypeInfo
    }
    |{
        kind: 'indexed_access',
        indexType: TypeInfo,
        objectType: TypeInfo,
    }
    |{
        kind: 'conditional',
        checkType: TypeInfo,
        extendsType: TypeInfo,
        trueType?: TypeInfo,
        falseType?: TypeInfo,
    }
    |{
        kind: 'substitution',
        baseType: TypeInfo,
        substitute: TypeInfo,
    }
    |{ kind: 'non_primitive', }
    |{ kind: 'intrinsic' }
    |{
        kind: 'template_literal',
        texts: readonly string[],
        types: TypeInfo[],
    }
    |{
        kind: 'string_mapping',
        symbol: SymbolInfo,
        type: TypeInfo,
    }
    |{
        kind: 'max_depth'
    }
    ))

export type TypeId = number

export type TypeInfoKind<K extends TypeInfo['kind']> = Extract<TypeInfo, { kind: K }>