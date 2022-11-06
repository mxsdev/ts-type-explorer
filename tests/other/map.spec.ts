import { APIConfig, getTypeInfoAtRange } from "@ts-type-explorer/api"
import path from "path"
import { createTsContext } from "../lib/tsUtil"

const fileName = path.join(__dirname, "map.ts")
const apiConfig = new APIConfig().setReferenceDefinedTypes()

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
    it("deosn't error when retrieving outside", () => {
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
})
