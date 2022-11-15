import { getTypeInfoChildren, TypeInfo } from "@ts-type-explorer/api"

export async function asyncMap<T, R>(
    arr: T[],
    transform: (el: T, index: number, arr: T[]) => Promise<R>
): Promise<R[]> {
    const res: R[] = []

    for (let i = 0; i < arr.length; i++) {
        const el = arr[i]
        res.push(await transform(el, i, arr))
    }

    return res
}

export function typeTreeDfs(typeInfo: TypeInfo, cb: (node: TypeInfo) => void) {
    cb(typeInfo)
    getTypeInfoChildren(typeInfo).forEach((child) => typeTreeDfs(child, cb))
}
