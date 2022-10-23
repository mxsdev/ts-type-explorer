import { generateTypeTree, TypeInfoLocalizer } from "@ts-type-explorer/api"
import {
    symbolBaselineGenerator,
    BaselineGenerator,
} from "./baselineGeneratorUtils"
import { normalizeTypeTree, normalizeLocalizedTypeTree } from "./normalize"

const stringify = (obj: unknown) => JSON.stringify(obj, undefined, 4)

// const mergeBaselineGenerator = typeBaselineGenerator(
//     (typeChecker, sourceFile, type) =>
//         multilineTypeToString(typeChecker, sourceFile, recursivelyExpandType(typeChecker, type))
// )

const treeBaselineGenerator = symbolBaselineGenerator((ctx, symbol, node) =>
    stringify(normalizeTypeTree(generateTypeTree({ symbol, node }, ctx)))
)

const localizedTreeBaselineGenerator = symbolBaselineGenerator(
    (ctx, symbol, node) => {
        const typeTree = normalizeTypeTree(
            generateTypeTree({ symbol, node }, ctx)
        )

        const localizer = new TypeInfoLocalizer(typeTree).debug()

        return stringify(
            normalizeLocalizedTypeTree(localizer.localize(typeTree), localizer)
        )
    }
)

export const BaselineGenerators: BaselineGenerator[] = [
    // {
    //     extension: '.merged.types',
    //     generator: mergeBaselineGenerator
    // },
    {
        extension: ".tree",
        generator: treeBaselineGenerator,
    },
    {
        extension: ".localized.tree",
        generator: localizedTreeBaselineGenerator,
    },
]
