import { getSymbolOrTypeOfNode, getSymbolType } from "@ts-type-explorer/api"
import { createTsContext } from "../lib/tsUtil"
import path from "path"
import assert from "assert"

// describe("symbols of symbols", () => {
//     it("test", () => {
//         const ctx = createTsContext(
//             path.join(__dirname, "../cases/promise.ts")
//         )

//         const { sourceFile, typeChecker } = ctx
        
//         const node = sourceFile
//             .getChildren()[0]
//             .getChildren()[0]
//             .getChildren()[1]

//         const { symbol } = getSymbolOrTypeOfNode(ctx, node)!
//         assert(symbol)

//         const type = getSymbolType(ctx, symbol)

//         const prop = type.getProperties()[3]

//         assert.strictEqual(
//             typeChecker.symbolToString(prop),
//             "[Symbol.toStringTag]",
//         )
//     })
// })
