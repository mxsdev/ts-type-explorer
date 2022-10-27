/* eslint-disable @typescript-eslint/no-explicit-any */

type ExpandObject<
    T extends object,
    Key extends string = "key",
    Value extends string = "value",
    S extends keyof T = keyof T
> = S extends string
    ? {
          [key in Key | Value]: key extends Key ? S : T[S]
      }
    : never

export function pairs<T extends Record<any, any>>(obj: T): ExpandObject<T>[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Object.keys(obj)
        .reduce(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (prev: any, curr: any) => [
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                { key: curr, value: obj[curr] } as any,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                ...prev,
            ],
            [] as ExpandObject<T>[]
        )
        .reverse()
}

export function mapObject<O extends Record<any, any>, R>(
    obj: O,
    func: (key: ExpandObject<O>) => R
): { [K in keyof O]: R } {
    const res = {}

    pairs(obj).forEach((v) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        res[v.key] = func(v)
    })

    return res as { [K in keyof O]: R }
}
