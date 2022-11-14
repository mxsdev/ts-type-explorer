import { getTypeInfoAtRange } from "@ts-type-explorer/api"
import assert from "assert"
import path from "path"
import { createTsContext } from "../lib/tsUtil"

const fileName = path.join(__dirname, "map.ts")
const apiConfig = { referenceDefinedTypes: true }

describe("map.ts", () => {
    it("doesn't error when retrieving outside", () => {
        const ctx = createTsContext(fileName)

        const pos = { line: 5, character: 0 }

        getTypeInfoAtRange(
            ctx,
            {
                fileName,
                range: {
                    start: pos,
                    end: pos,
                },
            },
            apiConfig
        )
    })
})

const fileName2 = path.join(__dirname, "map2.ts")

describe("map2.ts", () => {
    it("doesn't error when retrieving outside", () => {
        const ctx = createTsContext(fileName2)

        const pos = { line: 3, character: 0 }

        getTypeInfoAtRange(
            ctx,
            {
                fileName: fileName2,
                range: {
                    start: pos,
                    end: pos,
                },
            },
            apiConfig
        )
    })

    it("has proper return", () => {
        const ctx = createTsContext(fileName2)

        const pos = { line: 1, character: 47 }

        const info = getTypeInfoAtRange(ctx, {
            fileName: fileName2,
            range: {
                start: pos,
                end: pos,
            },
        })

        assert(info && info.kind === "function")

        const returnType = info.signatures[0].returnType
        assert(
            returnType &&
                returnType.kind === "array" &&
                returnType.type.aliasSymbolMeta?.name === "Type"
        )
    })
})
