/* eslint-disable @typescript-eslint/require-await */
import {
    APIConfig,
    generateTypeTree,
    getDescendantAtPosition,
    getNodeSymbol,
    getNodeType,
    SourceFileLocation,
    SourceFileTypescriptContext,
    TypeInfoResolver,
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

function getTypeInfoRetriever(ctx: SourceFileTypescriptContext) {
    return async (location: SourceFileLocation) => {
        const sourceFile = ctx.program.getSourceFile(location.fileName)
        assert(sourceFile)

        const { line, character } = location.range.start
        const node = getDescendantAtPosition(
            ctx,
            sourceFile.getPositionOfLineAndCharacter(line, character)
        )

        const symbol = getNodeSymbol(ctx, node)

        if (symbol) {
            return normalizeTypeTree(
                generateTypeTree({ symbol, node }, ctx, apiConfig),
                false
            )
        } else {
            const type = getNodeType(ctx, node)
            assert(type, "Symbol/type not found")
            return normalizeTypeTree(
                generateTypeTree({ type, node }, ctx, apiConfig),
                false
            )
        }
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
