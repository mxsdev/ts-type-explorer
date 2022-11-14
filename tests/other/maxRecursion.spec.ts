import { getTypeInfoOfNode } from "@ts-type-explorer/api"
import assert from "assert"
import path from "path"
import { createTsContext } from "../lib/tsUtil"

describe("max recursion check", () => {
    it("shouldn't occur on TypeInfoMap", () => {
        const fileName = path.join(__dirname, "../../packages/api/src/types.ts")
        const ctx = createTsContext(fileName)

        const sourceFile = ctx.program.getSourceFile(fileName)
        assert(sourceFile)

        const rootNode = sourceFile
            .getChildren()[0]
            .getChildren()
            .find((x) => x.getText().includes("export type TypeInfoMap"))
            ?.getChildren()
            .find((x) => x.getText() === "TypeInfoMap")

        assert(rootNode)

        const rootInfo = getTypeInfoOfNode(ctx, rootNode, {
            referenceDefinedTypes: true,
        })
    })
})
