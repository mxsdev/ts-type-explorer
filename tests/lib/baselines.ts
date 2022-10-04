import ts from "typescript"
import { recursiveMergeIntersection } from "../../src/merge.js"
import { getTypeOrDeclaredType, resolvedTypeToString } from "../../src/util.js"
import { globby } from "globby"
import path from "path"
import fs from "fs-extra"
import { dirname } from "./files.js"
import assert from "assert"

function getTestGlob(): string|undefined { return process.env["TESTS"] }

const testCasePath = path.join(dirname, "../cases")
const baselinesPath = path.join(dirname, "../baselines")
const baselinesLocalPath = path.join(baselinesPath, "local")
const baselinesReferencePath = path.join(baselinesPath, "reference")

async function getTestCases(): Promise<string[]> {
    const globbed = await globby([ getTestGlob() ?? "*"], {
        cwd: testCasePath,
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
                        fileName: `${test}.merged.types`,
                        generator: () => generateMergeBaseline(sourceFile, typeChecker)
                    },
                ]).forEach((baseline) => {
                    it(`Baseline ${baseline.fileName}`, async () => {
                        const correct = [`=== ${testName} ===`, "", baseline.generator()].join("\n")
                        const against = (await fs.readFile(
                            path.join(baselinesReferencePath, baseline.fileName)
                        ).catch(() => undefined))?.toString()
    
                        try {
                            assert.strictEqual(correct, against)
                        } catch(e) {
                            await fs.writeFile(path.join(baselinesLocalPath, baseline.fileName), correct)
                            throw e
                        }
    
                    })
                })
            })
        }
    })
}

export function generateMergeBaseline(sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker) {
    return sourceFile
        .getChildren()[0]!
        .getChildren()
        .map(c => generateMergeBaselineRecursive(c, typeChecker))
        .join("\n\n")
}

function generateMergeBaselineRecursive(node: ts.Node, typeChecker: ts.TypeChecker, depth: number = 0): string {
    const symbol = typeChecker.getSymbolAtLocation(node)
    
    let line: string = `${node.getText()}`
    if(symbol) {
        const type = getTypeOrDeclaredType(typeChecker, symbol, node)
        line += ` --- ${resolvedTypeToString(typeChecker, recursiveMergeIntersection(typeChecker, type))}`
    }

    const childLines = node.getChildren()
        .map(node => generateMergeBaselineRecursive(node, typeChecker, depth + 1))
        .flatMap(text => text.split("\n"))
        .filter(text => !!text)
        .map(text => depth === 0 ? `> ${text}` : text)
        .join("\n")

    if(childLines || symbol) {
        return line + "\n" + childLines
    }

    return ``
}