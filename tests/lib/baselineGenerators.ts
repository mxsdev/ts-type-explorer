import { multilineTypeToString, recursivelyExpandType, generateTypeTree, TypeInfoLocalizer } from "@ts-expand-type/api"
import { typeBaselineGenerator, symbolBaselineGenerator, BaselineGenerator } from "./baselineGeneratorUtils"
import { normalizeTypeTree, normalizeLocalizedTypeTree } from "./normalize";

const stringify = (obj: any) => JSON.stringify(obj, undefined, 4);

const mergeBaselineGenerator = typeBaselineGenerator(
    (typeChecker, sourceFile, type) => 
        multilineTypeToString(typeChecker, sourceFile, recursivelyExpandType(typeChecker, type))
)

const treeBaselineGenerator = symbolBaselineGenerator(
    (typeChecker, sourceFile, symbol, node) =>
        stringify(
            normalizeTypeTree(
                generateTypeTree({ symbol, node }, typeChecker)
            ),
        )
)

const localizedTreeBaselineGenerator = symbolBaselineGenerator(
    (typeChecker, sourceFile, symbol, node) => {
        const typeTree = normalizeTypeTree(
            generateTypeTree({ symbol, node }, typeChecker)
        )

        const localizer = new TypeInfoLocalizer(typeTree).debug()

        return stringify(
            normalizeLocalizedTypeTree(
                localizer.localize(typeTree), localizer
            )
        )
    }
)

export const BaselineGenerators: BaselineGenerator[] = [
    // {
    //     extension: '.merged.types',
    //     generator: mergeBaselineGenerator
    // },
    {
        extension: '.tree',
        generator: treeBaselineGenerator
    },
    {
        extension: '.localized.tree',
        generator: localizedTreeBaselineGenerator
    }
]
