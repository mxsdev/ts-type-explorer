import { TypeInfoKind, TypeInfo } from "@ts-expand-type/api"

type PrimitiveKind = TypeInfoKind<'primitive'>['primitive']

export const PrimitiveKindText: Record<PrimitiveKind, string> = {
    "any": "any",
    "bigint": "BigInt",
    "boolean": "boolean",
    "enum": "enum",
    "essymbol": "ESSymbol",
    "unique_symbol": "ESSymbol",
    "never": "never",
    "null": "null",
    "number": "number",
    "undefined": "undefined",
    "void": "void",
    "string": "string",
    "unknown": "unknown"
}

type Kind = Exclude<TypeInfo['kind'], 'reference'>
export const KindText: Record<Kind, string> = {
    "bigint_literal": "$1L",
    "boolean_literal": "$1",
    "enum_literal": "$1",
    "number_literal": "$1",
    "conditional": "conditional",
    "index": "Index",
    "indexed_access": "access",
    "intersection": "intersection",
    "union": "union",
    "non_primitive": "non-primitive",
    "object": "object",
    "string_literal": "\"$1\"",
    "string_mapping": "string mapping",
    "type_parameter": "parameter",
    "primitive": "primitive",
    "substitution": "substitution",
    "template_literal": "template",
    "max_depth": "...",
    "array": "array",
    "tuple": "tuple",
    "function": "function",
}

export function getKindText(kind: Kind, ...args: {toString(): string}[]) {
    return args.reduce<string>((prev, curr, i) => {
        return prev.replace(new RegExp(`\\\$${i+1}`, "g"), curr.toString())
    }, KindText[kind])
}

export function getPrimitiveKindText(kind: PrimitiveKind) {
    return PrimitiveKindText[kind]
}