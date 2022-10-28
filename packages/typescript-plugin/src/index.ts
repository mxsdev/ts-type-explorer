import {
    getSymbolType,
    generateTypeTree,
    getNodeType,
    getNodeSymbol,
    getDescendantAtPosition,
    TypescriptContext,
    APIConfig,
    SymbolOrType,
    ExpandedQuickInfo,
} from "@ts-type-explorer/api"
import { isValidType, SourceFileTypescriptContext } from "@ts-type-explorer/api"

// TODO: add config for e.g. max depth

function init(modules: {
    typescript: typeof import("typescript/lib/tsserverlibrary")
}) {
    function create(info: ts.server.PluginCreateInfo) {
        // Set up decorator object
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const proxy: ts.LanguageService = Object.create(null)
        for (const k of Object.keys(info.languageService) as Array<
            keyof ts.LanguageService
        >) {
            const x = info.languageService[k]!
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-return
            proxy[k] = (...args: Array<{}>) =>
                // @ts-expect-error - JS runtime trickery which is tricky to type tersely
                x.apply(info.languageService, args)
        }

        proxy.getQuickInfoAtPosition = function (fileName, position) {
            let prior = info.languageService.getQuickInfoAtPosition(
                fileName,
                position
            ) as ExpandedQuickInfo

            const program = info.project["program"] as ts.Program | undefined

            if (!program) return prior

            const typeChecker = program.getTypeChecker()
            const sourceFile = program.getSourceFile(fileName)

            if (!sourceFile) return prior

            const ctx: SourceFileTypescriptContext = {
                program,
                typeChecker,
                sourceFile,
                ts: modules.typescript,
            }

            const node = getDescendantAtPosition(ctx, position)

            if (!node || node === sourceFile) {
                // Avoid giving quickInfo for the sourceFile as a whole.
                return prior
            }

            const symbolOrType = getSymbolOrType(ctx, node)

            if (!symbolOrType) {
                return prior
            }

            if (!prior) {
                prior = {} as ExpandedQuickInfo
            }

            const apiConfig = new APIConfig()
            apiConfig.referenceDefinedTypes = true

            if (prior) {
                prior.__displayTree = generateTypeTree(
                    symbolOrType,
                    ctx,
                    apiConfig
                )
            }

            return prior
        }

        return proxy
    }

    return { create }
}

function getSymbolOrType(
    ctx: TypescriptContext,
    node: ts.Node
): SymbolOrType | undefined {
    const { typeChecker } = ctx

    const symbol =
        typeChecker.getSymbolAtLocation(node) ?? getNodeSymbol(ctx, node)

    if (symbol) {
        const symbolType = getSymbolType(ctx, symbol, node)

        if (isValidType(symbolType)) {
            return { symbol, node }
        }
    }

    const type = getNodeType(ctx, node)

    if (type) {
        return { type, node }
    }

    return undefined
}

export = init
