import {
    CustomTypeScriptRequest,
    CustomTypeScriptResponseBody,
    getTypeInfoAtRange,
} from "@ts-type-explorer/api"
import { SourceFileTypescriptContext } from "@ts-type-explorer/api"

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

        function getContext(
            fileName: string
        ): SourceFileTypescriptContext | undefined {
            const program = info.project["program"] as ts.Program | undefined

            if (!program) return undefined

            const typeChecker = program.getTypeChecker()
            const sourceFile = program.getSourceFile(fileName)

            if (!sourceFile) return undefined

            return {
                program,
                typeChecker,
                sourceFile,
                ts: modules.typescript,
            }
        }

        // @ts-expect-error - returning custom response types
        proxy.getCompletionsAtPosition = function (...args) {
            // triggerCharacter is "hijacked" with custom request information
            const { triggerCharacter: possiblePayload } = args[2] ?? {}

            if (!possiblePayload || typeof possiblePayload === "string") {
                return info.languageService.getCompletionsAtPosition(...args)
            }

            const payload =
                possiblePayload as unknown as CustomTypeScriptRequest

            const [fileName] = args
            const ctx = getContext(fileName)

            if (!ctx) {
                return undefined
            }

            if (payload.id === "type-tree") {
                const typeInfo = getTypeInfoAtRange(ctx, {
                    fileName,
                    range: payload.range,
                })

                return { typeInfo } as CustomTypeScriptResponseBody<"type-tree">
            }

            return undefined
        }

        return proxy
    }

    return { create }
}

export = init
