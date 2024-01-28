/* eslint-disable import/no-extraneous-dependencies */
import * as path from "node:path"
import type * as ts from "typescript/lib/tsserverlibrary"
import { type FileRegistry } from "@volar/language-core"
import { proxyCreateProgram } from "@volar/typescript"
import { createParsedCommandLine, createVueLanguage } from "@vue/language-core"
import * as SourceMaps from "@volar/source-map"
import { createFakeGlobalTypesHolder } from "vue-tsc"
import { SourceFileLocation, TypescriptContext } from "./types"

const windowsPathReg = /\\/g

export function getVueComiler(currentDir: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
    return require(path.join(
        currentDir,
        "node_modules",
        "@vue/compiler-sfc"
    )) as typeof import("@vue/compiler-sfc")
}

let oldProgram: ts.Program | undefined

export function getVueSourceFile(
    ctx: TypescriptContext,
    location: SourceFileLocation,
    startPos = -1
) {
    const fileName = location.fileName

    const compilerOptions = {
        rootDir: ctx.program.getCurrentDirectory(),
        sourceMap: true,
        declaration: true,
        emitDeclarationOnly: true,
        allowNonTsExtensions: true,
    }

    const host = ctx.ts.createCompilerHost(compilerOptions)
    const options: ts.CreateProgramOptions = {
        host,
        rootNames: [...ctx.program.getRootFileNames(), fileName],
        options: compilerOptions,
        oldProgram: oldProgram,
    }

    const fakeGlobalTypesHolder = createFakeGlobalTypesHolder(options)

    const createProgram = proxyCreateProgram(
        ctx.ts,
        ctx.ts.createProgram,
        [".vue"],
        (ts, options) => {
            const { configFilePath } = options.options
            const vueOptions =
                typeof configFilePath === "string"
                    ? createParsedCommandLine(
                          ts,
                          ts.sys,
                          configFilePath.replace(windowsPathReg, "/")
                      ).vueOptions
                    : {}
            return [
                createVueLanguage(
                    ts,
                    (id) => id,
                    options.options,
                    vueOptions,
                    true,
                    fakeGlobalTypesHolder?.replace(windowsPathReg, "/")
                ),
            ]
        }
    )
    const program = createProgram(options)

    oldProgram = program

    const sourceFile = program.getSourceFile(fileName)

    if (sourceFile) {
        // @ts-expect-error TODO: need inject virtual files  https://github.com/volarjs/volar.js/blob/v2.0.0/packages/typescript/lib/node/proxyCreateProgram.ts#L131
        if (program.files) {
            // @ts-expect-error TODO
            const vFile = (program.files as FileRegistry).get(fileName)

            if (
                vFile?.generated?.code &&
                vFile?.generated?.code.languageId === "vue"
            ) {
                const code = vFile?.generated?.code?.embeddedCodes[0]

                const sourceMap = new SourceMaps.SourceMap(code.mappings)
                startPos =
                    (sourceMap.getGeneratedOffset(startPos)?.[0] || -1) +
                    // https://github.com/volarjs/volar.js/blob/v2.0.0/packages/typescript/lib/node/proxyCreateProgram.ts#L84
                    (vFile?.generated?.code?.snapshot?.getLength() || 0)
            }
        }
    }

    return {
        sourceFile,
        startPos,
    }
}
