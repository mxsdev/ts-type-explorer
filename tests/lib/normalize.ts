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
    context?: Map<TypeId, TypeId>
): TypeInfo {
    context ??= new Map()

    if (!context.has(typeTree.id)) {
        const newId = context.size.toString()
        context.set(typeTree.id, newId)

        typeTree.id = newId
    } else {
        typeTree.id = context.get(typeTree.id)!
    }

    getTypeInfoChildren(typeTree).forEach((t) => normalizeTypeTree(t, context))

    getTypeInfoSymbols(typeTree).forEach((s) => {
        s.declarations?.forEach((d) => {
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
        seen: Set<TypeId>
    }
): Promise<LocalizedTypeInfoWithId> {
    context ??= { seen: new Set() }

    if (typeTree._id) {
        if (context.seen.has(typeTree._id)) {
            return { reference: typeTree._id }
        } else {
            context.seen.add(typeTree._id)
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
