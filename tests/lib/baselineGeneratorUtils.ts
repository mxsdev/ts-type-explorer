import {
    getSymbolType,
    SourceFileTypescriptContext,
} from "@ts-type-explorer/api"
import * as ts from "typescript"

export type BaselineGenerator = {
    extension: string
    generator: BaselineGeneratorFunction
}

type BaselineGeneratorFunction = (
    ctx: SourceFileTypescriptContext,
    node: ts.Node
) => string | undefined

export function typeBaselineGenerator(
    generator: (
        ctx: SourceFileTypescriptContext,
        type: ts.Type,
        symbol: ts.Symbol,
        node: ts.Node
    ) => string | undefined
): BaselineGeneratorFunction {
    return symbolBaselineGenerator((ctx, symbol, node) =>
        generator(ctx, getSymbolType(ctx, symbol, node), symbol, node)
    )
}

export function symbolBaselineGenerator(
    generator: (
        ctx: SourceFileTypescriptContext,
        symbol: ts.Symbol,
        node: ts.Node
    ) => string | undefined
): BaselineGeneratorFunction {
    return (ctx, node) => {
        const symbol = ctx.typeChecker.getSymbolAtLocation(node)
        if (symbol) {
            return generator(ctx, symbol, node)
        }
        return undefined
    }
}

export function generateBaseline(
    generator: BaselineGeneratorFunction,
    ctx: SourceFileTypescriptContext
) {
    return ctx.sourceFile
        .getChildren()[0]!
        .getChildren()
        .map((c) => generateBaselineRecursive(generator, c, ctx).join("\n"))
        .join("\n\n")
}

function generateBaselineRecursive(
    generator: BaselineGeneratorFunction,
    node: ts.Node,
    ctx: SourceFileTypescriptContext,
    depth = 0
): string[] {
    let line = `${node.getText()}`
    const generated = generator(ctx, node)

    if (generated) {
        line += ` --- ${generated}`
    }

    const childLines = node
        .getChildren()
        .map((node) =>
            generateBaselineRecursive(generator, node, ctx, depth + 1)
        )
        .filter((lines) => lines.length > 0)
        .flatMap((x) => x)
        .map((text) => (depth === 0 ? `> ${text}` : text))

    if ((childLines && childLines.length > 0) || generated !== undefined) {
        return [line, ...childLines]
    }

    return []
}
