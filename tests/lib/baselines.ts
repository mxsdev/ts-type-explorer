import ts from "typescript"
import { getSymbolType, multilineTypeToString, recursivelyExpandType, generateTypeTree } from "@ts-expand-type/api";
import path from "path"
import fs from "fs-extra"
import { dirname } from "./files"
import assert from "assert"
import glob from "glob"

function getTestGlob(): string|undefined { return process.env["TESTS"] }

const testCasePath = path.join(dirname, "../cases")
const baselinesPath = path.join(dirname, "../baselines")
const baselinesLocalPath = path.join(baselinesPath, "local")
const baselinesReferencePath = path.join(baselinesPath, "reference")

export async function getTestCases(): Promise<string[]> {
    const globbed = await new Promise<string[]>((resolve, reject) => {
        const res = glob(getTestGlob() ?? "*", { cwd: testCasePath }, (err, files) => {
            if(err) {
                reject(err)
            }
            resolve(files)
        })
    })

    return globbed.filter(name => path.parse(name).ext.toLowerCase() === ".ts")
}

function getTestName(filePath: string) {
    return path.parse(filePath).name
}

export async function acceptBaselines() {
    await fs.copy(
        baselinesLocalPath,
        baselinesReferencePath,
        {
            overwrite: true,
        }
    )
}

const mergeBaselineGenerator = typeBaselineGenerator(
    (typeChecker, sourceFile, type) => 
        multilineTypeToString(typeChecker, sourceFile, recursivelyExpandType(typeChecker, type))
)

const treeBaselineGenerator = symbolBaselineGenerator(
    (typeChecker, sourceFile, symbol) =>
        JSON.stringify(
            generateTypeTree({ symbol }, { typeChecker })
        )
)

export async function generateBaselineTests() {
    const allTestCases = await getTestCases()

    describe("baselines", () => {
        for(const testName of allTestCases) {
            const filePath = path.join(testCasePath, testName)
    
            const test = getTestName(filePath)
    
            const program = ts.createProgram([filePath], { })
            const sourceFile = program.getSourceFile(filePath)!
    
            const typeChecker = program.getTypeChecker()
    
            describe(`${testName} baselines`, async () => {
                ;([
                    {
                        extension: '.merged.types',
                        generator: mergeBaselineGenerator
                    },
                    {
                        extension: '.tree',
                        generator: treeBaselineGenerator
                    }
                ]).forEach((baseline) => {
                    const testFileName = `${test}${baseline.extension}`

                    it(`Baseline ${testFileName}`, async () => {
                        const correct = [`=== ${testName} ===`, "", generateBaseline(baseline.generator, sourceFile, typeChecker)].join("\n")
                        const against = (await fs.readFile(
                            path.join(baselinesReferencePath, testFileName)
                        ).catch(() => undefined))?.toString()
    
                        try {
                            assert.strictEqual(correct, against)
                        } catch(e) {
                            await fs.writeFile(path.join(baselinesLocalPath, testFileName), correct)
                            throw e
                        }
    
                    })
                })
            })
        }
    })
}

type BaselineGenerator = (typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, node: ts.Node) => string|undefined

function typeBaselineGenerator(generator: (typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, type: ts.Type, symbol: ts.Symbol, node: ts.Node) => string|undefined): BaselineGenerator {
    return symbolBaselineGenerator((typeChecker, sourceFile, symbol, node) => generator(typeChecker, sourceFile, getSymbolType(typeChecker, symbol, node), symbol, node))
}

function symbolBaselineGenerator(generator: (typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, symbol: ts.Symbol, node: ts.Node) => string|undefined): BaselineGenerator {
    return (typeChecker, sourceFile, node) => {
        const symbol = typeChecker.getSymbolAtLocation(node)
        if(symbol) {
            return generator(typeChecker, sourceFile, symbol, node)
        }
        return undefined
    }
}

export function generateBaseline(generator: BaselineGenerator, sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) {
    return sourceFile
        .getChildren()[0]!
        .getChildren()
        .map(c => generateBaselineRecursive(generator, c, typeChecker, sourceFile))
        .join("\n\n")
}

function generateBaselineRecursive(generator: BaselineGenerator, node: ts.Node, typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, depth: number = 0): string {
    let line: string = `${node.getText()}`
    const generated = generator(typeChecker, sourceFile, node)
    if(generated) {
        line += ` --- ${generated}`
    }

    const childLines = node.getChildren()
        .map(node => generateBaselineRecursive(generator, node, typeChecker, sourceFile, depth + 1))
        .flatMap(text => text.split("\n"))
        .filter(text => !!text)
        .map(text => depth === 0 ? `> ${text}` : text)
        .join("\n")

    if(childLines || generated !== undefined) {
        return line + "\n" + childLines
    }

    return ``
}