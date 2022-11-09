import { getTypeInfoAtRange } from "@ts-type-explorer/api"
import assert from "assert"
import path from "path"
import { createTsContext } from "../lib/tsUtil"

const fileName = path.join(__dirname, "./intersectionComponent.tsx")

describe("intersectionComponent.tsx", () => {
    it("registers as component in type tree", () => {
        const ctx = createTsContext(fileName)
        const pos = { line: 4, character: 8 }

        const info = getTypeInfoAtRange(ctx, {
            fileName,
            range: { start: pos, end: pos },
        })

        assert(info?.kind === "function")
        assert(info.isJSXElement)
    })

    it("has proper types for properties", () => {
        const ctx = createTsContext(fileName)
        const pos = { line: 4, character: 15 }

        const info = getTypeInfoAtRange(ctx, {
            fileName,
            range: { start: pos, end: pos },
        })

        assert(info?.kind === "function")

        const param = info.signatures[0].parameters[0]
        assert(param.kind === "object")
        assert(param.symbolMeta?.name === "event")
    })

    it("has declaration locations", () => {
        const ctx = createTsContext(fileName)
        const pos = { line: 4, character: 8 }

        const info = getTypeInfoAtRange(ctx, {
            fileName,
            range: { start: pos, end: pos },
        })
    })
})
