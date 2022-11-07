import { getTypeInfoAtRange } from "@ts-type-explorer/api"
import { createTsContext } from "../lib/tsUtil"
import path from "path"

const fileName = path.join(__dirname, "./tsmodule.ts")

describe("tsmodule.ts", () => {
    it("can get module information", () => {
        const ctx = createTsContext(fileName)
        const pos = { line: 0, character: 24 }

        getTypeInfoAtRange(ctx, {
            fileName,
            range: {
                start: pos,
                end: pos,
            },
        })
    })
})
