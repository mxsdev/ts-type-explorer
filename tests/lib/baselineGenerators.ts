/* eslint-disable @typescript-eslint/require-await */
import {
    APIConfig,
    generateTypeTree,
    SourceFileLocation,
    TypeInfoResolver,
    TypescriptContext,
    getTypeInfoAtRange,
} from "@ts-type-explorer/api"
import assert from "assert"
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

const treeBaselineGenerator = symbolBaselineGenerator(
    async (ctx, symbol, node) =>
        stringify(normalizeTypeTree(generateTypeTree({ symbol, node }, ctx)))
)

const apiConfig = new APIConfig()
apiConfig.referenceDefinedTypes = true

const localizedTreeBaselineGenerator = symbolBaselineGenerator(
    async (ctx, symbol, node) => {
        const typeTree = normalizeTypeTree(
            generateTypeTree({ symbol, node }, ctx, apiConfig),
            false
        )

        const resolver = new TypeInfoResolver(getTypeInfoRetriever(ctx)).debug()

        return stringify(
            await normalizeLocalizedTypeTree(
                await resolver.localize(typeTree),
                resolver
            )
        )
    }
)

function getTypeInfoRetriever(ctx: TypescriptContext) {
    return async (location: SourceFileLocation) => {
        const typeTree = getTypeInfoAtRange(ctx, location, apiConfig)

        assert(typeTree, "Symbol/type not found!")

        return normalizeTypeTree(typeTree, false)
    }
}

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
