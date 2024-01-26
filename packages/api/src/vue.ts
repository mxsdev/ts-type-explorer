/* eslint-disable import/no-extraneous-dependencies */
import * as path from "node:path"
import type * as ts from "typescript/lib/tsserverlibrary"
import { FileKind, forEachEmbeddedFile } from "@volar/language-core"
import * as SourceMaps from "@volar/source-map"
import { createProgram } from "vue-tsc"

export function getVueComiler(currentDir: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
    return require(path.join(
        currentDir,
        "node_modules",
        "@vue/compiler-sfc"
    )) as typeof import("@vue/compiler-sfc")
}

const ensureTs = (filename: string) =>
    filename.endsWith(".ts") || filename.endsWith(".tsx")
        ? filename
        : filename + ".ts"

const ensureJs = (filename: string) =>
    filename.endsWith(".js") || filename.endsWith(".jsx")
        ? filename
        : filename + ".js"

let oldProgram: ReturnType<typeof createProgram>

export function getVueSourceFile(
    _program: ts.Program,
    ts: typeof import("typescript/lib/tsserverlibrary"),
    fileName: string,
    _startPos: number
) {
    const compilerOptions = {
        ..._program.getCompilerOptions(),
        sourceMap: true,
        declaration: true,
        emitDeclarationOnly: true,
    }

    const host = ts.createCompilerHost(compilerOptions)
    const program = createProgram({
        host,
        rootNames: [
            ..._program.getRootFileNames(),
            fileName,
            path.join(_program.getCurrentDirectory(), "__VLS_types.d.ts"),
        ],
        options: compilerOptions,
        oldProgram: oldProgram,
    })

    oldProgram = program

    const vueCore = program.__vue.langaugeContext
    const vFile =
        vueCore.virtualFiles.getVirtualFile(fileName)[0]?.embeddedFiles[0]

    let startPos = -1

    if (vFile) {
        forEachEmbeddedFile(vFile, (embedded) => {
            if (embedded.kind === FileKind.TypeScriptHostFile) {
                const sourceMap = new SourceMaps.SourceMap(embedded.mappings)
                startPos = sourceMap.toGeneratedOffset(_startPos)?.[0] || -1
            }
        })
    }

    return {
        sourceFile:
            program.getSourceFile(ensureTs(fileName)) ||
            program.getSourceFile(ensureJs(fileName)),
        program,
        typeChecker: program.getTypeChecker(),
        startPos,
    }
}
