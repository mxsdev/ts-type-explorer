import { TypeInfoKind, TypeInfo } from "@ts-expand-type/api"

type PrimitiveKind = TypeInfoKind<'primitive'>['primitive']

export const PrimitiveKindText: Record<PrimitiveKind, string> = {
    "any": "any",
    "bigint": "BigInt",
    "boolean": "boolean",
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

export type LocalizableKind = Exclude<TypeInfo['kind'], 'reference'>
export const KindText: Record<LocalizableKind|'method', string> = {
    "bigint_literal": "$1n",
    "boolean_literal": "$1",
    "enum_literal": "enum",
    "number_literal": "$1",
    "conditional": "conditional",
    "index": "keyof",
    "indexed_access": "access",
    "intersection": "intersection",
    "union": "union",
    "non_primitive": "non-primitive",
    "object": "object",
    "string_literal": "\"$1\"",
    "string_mapping": "string mapping",
    "type_parameter": "type parameter",
    "primitive": "primitive",
    "substitution": "substitution",
    "template_literal": "template",
    "max_depth": "...",
    "array": "array",
    "tuple": "tuple",
    "function": "function",
    "intrinsic": "intrinsic",
    "enum": "enum",
    "class": "class",
    "interface": "interface",
    "method": "method",
}

export function getKindText(kind: LocalizableKind, { insideClassOrInterface }: { insideClassOrInterface?: boolean } = {}, ...args: string[]) {
    return args.reduce<string>((prev, curr, i) => {
        return prev.replace(new RegExp(`\\\$${i+1}`, "g"), curr)
    }, KindText[(kind === 'function' && insideClassOrInterface) ? 'method' : kind])
}

export function getPrimitiveKindText(kind: PrimitiveKind) {
    return PrimitiveKindText[kind]
}