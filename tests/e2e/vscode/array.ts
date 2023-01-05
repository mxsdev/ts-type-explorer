import { VscodeE2E } from "../util/vscodeE2E"

const test = VscodeE2E.testCase("array.ts")

describe("array.ts", () => {
    it(
        "should identify variable",
        test(1, 7, "arrayOfStrings", async (root) => {
            expect(await root.getDescription()).toBe("string[]")
            expect(await root.getChildren()).toHaveLength(0)
        })
    )

    it(
        "should identify simple type",
        test(1, 25, "", async (root) => {
            expect(await root.getDescription()).toBe("string")
        })
    )
})
