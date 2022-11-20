import {
    TypeInfo,
    TypeId,
    getTypeInfoChildren,
    getTypeInfoSymbols,
    LocalizedTypeInfo,
    TypeInfoResolver,
} from "@ts-type-explorer/api"
import path from "path"
import { rootPath } from "./files"
import { asyncMap } from "./testUtil"

function normalizeFilePath(filePath: string) {
    return path.relative(rootPath, filePath)
}

export function normalizeTypeTree(
    typeTree: TypeInfo,
    normalizeIds = true,
    context?: Map<TypeId, TypeId>
): TypeInfo {
    context ??= new Map()

    if (normalizeIds) {
        if (!context.has(typeTree.id)) {
            const newId = context.size.toString()
            context.set(typeTree.id, newId)

            typeTree.id = newId
        } else {
            typeTree.id = context.get(typeTree.id)!
        }
    }

    getTypeInfoChildren(typeTree).forEach((t) =>
        normalizeTypeTree(t, normalizeIds, context)
    )

    getTypeInfoSymbols(typeTree).forEach((s) => {
        for (const declarations of [s.declarations, s.resolvedDeclarations]) {
            declarations?.forEach((d) => {
                // eslint-disable-next-line no-debugger
                // debugger
                d.location.fileName = normalizeFilePath(d.location.fileName)
            })
        }

        const literal = s.name.match(/^"(.*?)"$/)

        if (literal && literal[1]) {
            const value = literal[1]

            if (value.startsWith(rootPath)) {
                s.name = `"${normalizeFilePath(value)}"`
            }
        }
    })

    return typeTree
}

type LocalizedTypeInfoWithId =
    | (Omit<LocalizedTypeInfo, "children" | "typeArguments"> & {
          children: LocalizedTypeInfoWithId[]
          typeArguments?: LocalizedTypeInfoWithId[]
      })
    | { reference: TypeId }

export async function normalizeLocalizedTypeTree(
    typeTree: LocalizedTypeInfo,
    resolver: TypeInfoResolver,
    context?: {
        seen: Map<TypeId, TypeId>
    }
): Promise<LocalizedTypeInfoWithId> {
    context ??= { seen: new Map() }

    if (typeTree._id) {
        if (context.seen.has(typeTree._id)) {
            const id = context.seen.get(typeTree._id)!
            return { reference: id }
        } else {
            const newId = context.seen.size.toString()
            context.seen.set(typeTree._id, newId)

            typeTree._id = newId
        }
    }

    const localizedTrees: LocalizedTypeInfo[][] = []

    localizedTrees.push(await resolver.localizeChildren(typeTree))
    localizedTrees.push(await resolver.localizeChildren(typeTree, true))

    const [children, typeArguments] = await asyncMap(
        localizedTrees,
        (localizedChildren) =>
            asyncMap(localizedChildren, (c) =>
                normalizeLocalizedTypeTree(c, resolver, context)
            )
    )

    return {
        ...typeTree,
        children,
        typeArguments: typeArguments.length > 0 ? typeArguments : undefined,
    }
}
