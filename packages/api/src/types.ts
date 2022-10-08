import ts from "typescript"

export type SymbolInfo = {
    name: string,
    flags: number,
    anonymous?: boolean
}

export type IndexInfo = {
    keyType?: TypeInfo,
    type?: TypeInfo,
    parameterSymbol?: SymbolInfo
}

export type SignatureInfo = {
    symbolMeta?: SymbolInfo,
    parameters: TypeInfo[],
    returnType: TypeInfo
}

export type TypeParameterInfo = {
    name: string,
}

export type TypeInfo = TypeInfoNoId & { id: TypeId }

// TODO: "purpose" property for e.g. return types, subtypes of conditional_type/indexed access, etc

export type TypeInfoNoId = 
    ({
        symbolMeta?: SymbolInfo,
    } & (
    |{
        kind: 'primitive',
        primitive: 'any'|'unknown'|'string'|'number'|'boolean'|'enum'|'bigint'|'essymbol'|'unique_symbol'|'null'|'never'|'undefined'|'void'
    }
    |{ kind: 'reference' }
    |{ kind: 'string_literal', value: string, }
    |{ kind: 'number_literal', value: number, }
    |{ kind: 'boolean_literal', value: boolean }
    |{ kind: 'enum_literal', value: string }
    |{ kind: 'bigint_literal', value: ts.PseudoBigInt }
    |{
        kind: 'type_parameter',
    }
    |{
        kind: 'object',
        properties: TypeInfo[],
        indexInfos?: IndexInfo[],
        signatures?: SignatureInfo[],
        // objectFlags: number
        // TODO: array types
    }
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
        indexOf: TypeInfo
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
    |{
        kind: 'non_primitive',
        symbol: SymbolInfo,
    }
    |{
        kind: 'template_literal',
        texts: readonly string[],
        types: TypeInfo[],
    }
    |{
        kind: 'string_mapping',
        symbol: SymbolInfo,
    }
    |{
        kind: 'max_depth'
    }
    ))

export type TypeId = number

export type TypeInfoKind<K extends TypeInfo['kind']> = Extract<TypeInfo, { kind: K }>