/* eslint-disable import/no-extraneous-dependencies */
import type * as ts from "typescript/lib/tsserverlibrary"
import { type FileRegistry } from "@volar/language-core"
import { proxyCreateProgram } from "@volar/typescript"
import {
    createParsedCommandLine,
    createVueLanguagePlugin,
} from "@vue/language-core"
import * as SourceMaps from "@volar/source-map"
import { createFakeGlobalTypesHolder } from "vue-tsc"
import { SourceFileLocation, TypescriptContext } from "./types"

const windowsPathReg = /\\/g

// https://github.com/volarjs/volar.js/blob/v2.1.0/packages/typescript/lib/node/proxyCreateProgram.ts#L139
type VuePrograme = ts.Program & { __volar__?: { files: FileRegistry } }

let oldPrograme: VuePrograme | undefined

export function getPositionOfLineAndCharacterForVue(
    ctx: TypescriptContext,
    location: SourceFileLocation,
    startPos = -1
) {
    const fileName = location.fileName

    const compilerOptions = {
        ...ctx.program.getCompilerOptions(),
        sourceMap: true,
        declaration: true,
        emitDeclarationOnly: true,
        allowNonTsExtensions: true,
    }

    const options: ts.CreateProgramOptions = {
        host: ctx.ts.createCompilerHost(compilerOptions),
        rootNames: ctx.program.getRootFileNames(),
        options: compilerOptions,
        oldProgram: oldPrograme || ctx.program,
    }

    const createProgram = proxyCreateProgram(
        ctx.ts,
        ctx.ts.createProgram,
        [".vue"],
        (ts, _options) => {
            const { configFilePath } = _options.options
            const vueOptions =
                typeof configFilePath === "string"
                    ? createParsedCommandLine(
                          ts,
                          ts.sys,
                          configFilePath.replace(windowsPathReg, "/")
                      ).vueOptions
                    : {}
            return [
                createVueLanguagePlugin(
                    ts,
                    (id) => id,
                    _options.options,
                    vueOptions,
                    true,
                    createFakeGlobalTypesHolder(options)?.replace(
                        windowsPathReg,
                        "/"
                    )
                ),
            ]
        }
    )

    if (!oldPrograme?.__volar__) {
        oldPrograme = createProgram(options) as VuePrograme
    }

    const sourceFile = oldPrograme.getSourceFile(fileName)

    if (sourceFile) {
        if (oldPrograme.__volar__) {
            const vFile = oldPrograme.__volar__.files.get(fileName)

            if (
                vFile?.generated?.code &&
                vFile?.generated?.code.languageId === "vue"
            ) {
                const code = vFile?.generated?.code?.embeddedCodes?.[0]
                if (code) {
                    const sourceMap = new SourceMaps.SourceMap(code.mappings)
                    startPos =
                        (sourceMap.getGeneratedOffset(startPos)?.[0] || -1) +
                        // https://github.com/volarjs/volar.js/blob/v2.1.0/packages/typescript/lib/node/proxyCreateProgram.ts#L84
                        (vFile?.generated?.code?.snapshot?.getLength() || 0)
                }
            }
        }
    }

    ctx.typeChecker = oldPrograme.getTypeChecker()

    return startPos
}
