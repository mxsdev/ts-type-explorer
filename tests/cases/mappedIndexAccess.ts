interface FieldVals {
    string: string;
    number: number
}

type FieldFormat = Record<string, keyof FieldVals>

type MapField<T extends FieldFormat> = {
    [K in keyof T]: FieldVals[T[K]]
}

declare function createField<T extends FieldFormat>(data: T): MapField<T>

const f = createField({a: "string"})

f.a