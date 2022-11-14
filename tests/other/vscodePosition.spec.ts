import { createTsContext } from "../lib/tsUtil"
import path from "path"
import { getTypeInfoAtRange } from "@ts-type-explorer/api"
import assert from "assert"

const fileName = path.join(__dirname, "vscodePosition.ts")

describe("vscodePosition.ts", () => {
    it("doesn't cause max depth", () => {
        const ctx = createTsContext(fileName)

        const pos1 = {
            line: 2,
            character: 18,
        }

        const typeInfo = getTypeInfoAtRange(
            ctx,
            {
                fileName,
                range: {
                    start: pos1,
                    end: pos1,
                },
            },
            { referenceDefinedTypes: true }
        )

        assert(typeInfo)
        assert(typeInfo.kind === "class")

        const ref1 = typeInfo.properties[5]
        assert(ref1.kind === "reference")
        assert(ref1.location)

        const refTypeInfo = getTypeInfoAtRange(ctx, ref1.location)
        assert(refTypeInfo && refTypeInfo.kind === "function")

        const signature = refTypeInfo.signatures[0]
        assert(signature)

        assert(signature.parameters.every((x) => x.kind !== "max_depth"))
    })
})
