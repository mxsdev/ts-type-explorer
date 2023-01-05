import path from "path"
import { VscodeE2E } from "../util/vscodeE2e"

describe("array.ts", () => {
    it(
        "should identify variable",
        VscodeE2E.testFile(
            path.join(__dirname, "../../cases/array.ts"),
            async (tree, editor) => {
                await editor.moveCursor(1, 7)

                const root = await tree.waitRoot("arrayOfStrings")

                expect(await root.getDescription()).toBe("string[]")
                expect(await root.getChildren()).toHaveLength(0)
            }
        )
    )

    it(
        "should identify simple type",
        VscodeE2E.testFile(
            path.join(__dirname, "../../cases/array.ts"),
            async (tree, editor) => {
                await editor.moveCursor(1, 25)

                const root = await tree.waitRoot("")

                expect(await root.getDescription()).toBe("string")
            }
        )
    )
})
