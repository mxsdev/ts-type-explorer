import { getTypeInfoAtRange } from "@ts-type-explorer/api"
import assert from "assert"
import path from "path"
import { createTsContext } from "../lib/tsUtil"

const pos = {
    line: 13,
    character: 6
}

describe("mappedIndexAccess.ts", () => {
    it("has proper symbol resolution through mapped type", () => {
        const fileName = path.join(__dirname, "../cases/mappedIndexAccess.ts")
        const ctx = createTsContext(fileName)
    
        const sourceFile = ctx.program.getSourceFile(fileName)
        assert(sourceFile)

        const parentInfo = getTypeInfoAtRange(
            ctx,
            {
                fileName,
                range: {
                    start: pos,
                    end: pos,
                },
            },
            { referenceDefinedTypes: true }
        )

        assert(parentInfo)
        assert(parentInfo.kind === "object")

        const typeInfo = parentInfo.properties[0]

        debugger

        assert(typeInfo)
        assert.strictEqual(typeInfo.kind, "primitive")
        assert(typeInfo.kind === "primitive")

        assert.strictEqual(typeInfo.primitive, "string")
    })
})