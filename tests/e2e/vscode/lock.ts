import { VscodeE2E, waitChildren } from "../util/vscodeE2E"

const test = VscodeE2E.testCaseFile("array.ts")

describe("type lock", () => {
    it(
        "normally doesn't lock",
        test(async (tree, editor) => {
            {
                await editor.moveCursor(1, 7)
                const root = await tree.getRoot()
                expect(await root.getLabel()).toBe("arrayOfStrings")
            }

            {
                await editor.moveCursor(1, 25)
                const root = await tree.getRoot()
                expect(await root.getLabel()).toBe("")
            }
        })
    )

    it(
        "locks if enabled",
        test(async (tree, editor) => {
            {
                await editor.moveCursor(1, 7)
                const root = await tree.getRoot()
                expect(await root.getLabel()).toBe("arrayOfStrings")
            }

            await tree.withLock(async () => {
                await editor.moveCursor(1, 25)
                const root = await tree.getRoot()
                expect(await root.getLabel()).toBe("arrayOfStrings")
            })
        })
    )
})
