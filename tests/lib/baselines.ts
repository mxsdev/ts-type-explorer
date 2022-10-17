import ts from "typescript"
import { getSymbolType, multilineTypeToString, recursivelyExpandType, generateTypeTree, TypeInfo, TypeId, getTypeInfoChildren, getTypeInfoSymbols, LocalizedTypeInfo, TypeInfoLocalizer } from "@ts-expand-type/api";
import path from "path"
import fs from "fs-extra"
import { baselinesLocalPath, baselinesReferencePath, testCasePath } from "./files"
import assert from "assert"
import glob from "glob"
import { BaselineGenerators } from "./baselineGenerators";
import { generateBaseline } from "./baselineGeneratorUtils";
import { stringify } from "querystring";

function getTestGlob(): string|undefined { return process.env["TESTS"] }

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

    await clearLocalBaselines()
}


export async function generateBaselineTests() {
    const allTestCases = await getTestCases()

    describe("baselines", () => {
        for(const testName of allTestCases) {
            const filePath = path.join(testCasePath, testName)
    
            const test = getTestName(filePath)

            describe(`${testName} baselines`, async () => {
                BaselineGenerators.forEach((baseline) => {
                    const testFileName = `${test}${baseline.extension}`
                    
                    it(`Baseline ${testFileName}`, async () => {
                        const program = getProgram(filePath)
                        const sourceFile = program.getSourceFile(filePath)!
                        const typeChecker = program.getTypeChecker()

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

export async function clearLocalBaselines() {
    await fs.remove(baselinesLocalPath)
    await fs.mkdir(baselinesLocalPath)
}

function getProgram(filePath: string): ts.Program {
    const program = ts.createProgram([filePath], { })
    return program
}