import {
    TypeInfo,
    TypeId,
    getTypeInfoChildren,
    getTypeInfoSymbols,
    LocalizedTypeInfo,
    TypeInfoLocalizer,
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
        s.declarations?.forEach((d) => {
            // eslint-disable-next-line no-debugger
            // debugger
            d.location.fileName = normalizeFilePath(d.location.fileName)
        })
    })

    return typeTree
}

type LocalizedTypeInfoWithId =
    | (Omit<LocalizedTypeInfo, "children"> & {
          children: LocalizedTypeInfoWithId[]
      })
    | { reference: TypeId }

export async function normalizeLocalizedTypeTree(
    typeTree: LocalizedTypeInfo,
    localizer: TypeInfoLocalizer,
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

    const children = await localizer
        .localizeChildren(typeTree)
        .then((localizedChildren) =>
            asyncMap(localizedChildren, (c) =>
                normalizeLocalizedTypeTree(c, localizer, context)
            )
        )

    return {
        ...typeTree,
        children,
    }
}
