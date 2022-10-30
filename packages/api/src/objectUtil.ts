/**
 * @internal
 */
export function wrapSafe<T, Args extends Array<unknown>, Return>(
    wrapped: (arg1: T, ...args: Args) => Return
): (arg1: T | undefined, ...args: Args) => Return | undefined {
    return (arg1, ...args) =>
        arg1 === undefined ? (arg1 as undefined) : wrapped(arg1, ...args)
}

/**
 * @internal
 */
export function isNonEmpty<T>(
    arr: readonly T[] | undefined
): arr is readonly T[] {
    return !!arr && arr.length > 0
}

/**
 * @internal
 */
export function isEmpty<T>(arr: readonly T[] | undefined): arr is undefined {
    return !isNonEmpty<T>(arr)
}

/**
 * @internal
 */
export function arrayContentsEqual(
    x: readonly unknown[],
    y: readonly unknown[]
) {
    return x.length === y.length && x.every((el, i) => y[i] == el)
}

/**
 * @internal
 */
export function filterUndefined<T>(arr: T[]): Exclude<T, undefined>[] {
    return arr.filter((x) => x !== undefined) as Exclude<T, undefined>[]
}

/**
 * @internal
 */
export function removeDuplicates<T extends object>(arr: T[]) {
    const set = new WeakSet<T>()

    return arr.filter((val) => {
        if (set.has(val)) {
            return false
        }

        set.add(val)
        return val
    })
}

/**
 * @internal
 */
export function cartesianEqual<T>(
    arr1: T[],
    arr2: T[],
    eq?: (t: T, k: T) => boolean
) {
    return arr1.some((x) => arr2.some((y) => eq?.(x, y) ?? x === y))
}

/**
 * @internal
 */
export function cloneClassInstance<T>(orig: T): T {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Object.assign(Object.create(Object.getPrototypeOf(orig)), orig) as T
}
