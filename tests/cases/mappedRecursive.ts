interface Fields {
    string: string
}

interface FieldForm {
    [key: string]: keyof Fields | FieldForm
}

type MapFields<T extends FieldForm> = {
    [K in keyof T]: T[K] extends FieldForm
    ? MapFields<T[K]>
    : T[K] extends keyof Fields
    ? Fields[T[K]]
    : never
}

declare function makeField<T extends FieldForm>(data: T): MapFields<T>

const fields = makeField({
    a: {
        b: {
            c: {
                d: {
                    e: "string"
                }
            }
        }
    }
})