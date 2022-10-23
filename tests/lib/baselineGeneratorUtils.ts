import { getSymbolType } from "@ts-type-explorer/api"
import * as ts from "typescript"

export type BaselineGenerator = {
    extension: string
    generator: BaselineGeneratorFunction
}

type BaselineGeneratorFunction = (
    typeChecker: ts.TypeChecker,
    sourceFile: ts.SourceFile,
    node: ts.Node
) => string | undefined

export function typeBaselineGenerator(
    generator: (
        typeChecker: ts.TypeChecker,
        sourceFile: ts.SourceFile,
        type: ts.Type,
        symbol: ts.Symbol,
        node: ts.Node
    ) => string | undefined
): BaselineGeneratorFunction {
    return symbolBaselineGenerator((typeChecker, sourceFile, symbol, node) =>
        generator(
            typeChecker,
            sourceFile,
            getSymbolType(typeChecker, symbol, node),
            symbol,
            node
        )
    )
}

export function symbolBaselineGenerator(
    generator: (
        typeChecker: ts.TypeChecker,
        sourceFile: ts.SourceFile,
        symbol: ts.Symbol,
        node: ts.Node
    ) => string | undefined
): BaselineGeneratorFunction {
    return (typeChecker, sourceFile, node) => {
        const symbol = typeChecker.getSymbolAtLocation(node)
        if (symbol) {
            return generator(typeChecker, sourceFile, symbol, node)
        }
        return undefined
    }
}

export function generateBaseline(
    generator: BaselineGeneratorFunction,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
) {
    return sourceFile
        .getChildren()[0]!
        .getChildren()
        .map((c) =>
            generateBaselineRecursive(
                generator,
                c,
                typeChecker,
                sourceFile
            ).join("\n")
        )
        .join("\n\n")
}

function generateBaselineRecursive(
    generator: BaselineGeneratorFunction,
    node: ts.Node,
    typeChecker: ts.TypeChecker,
    sourceFile: ts.SourceFile,
    depth = 0
): string[] {
    let line = `${node.getText()}`
    const generated = generator(typeChecker, sourceFile, node)

    if (generated) {
        line += ` --- ${generated}`
    }

    const childLines = node
        .getChildren()
        .map((node) =>
            generateBaselineRecursive(
                generator,
                node,
                typeChecker,
                sourceFile,
                depth + 1
            )
        )
        .filter((lines) => lines.length > 0)
        .flatMap((x) => x)
        .map((text) => (depth === 0 ? `> ${text}` : text))

    if ((childLines && childLines.length > 0) || generated !== undefined) {
        return [line, ...childLines]
    }

    return []
}
