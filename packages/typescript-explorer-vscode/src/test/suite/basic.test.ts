import * as assert from "assert"
import * as vscode from "vscode"
import * as extension from "../../extension"
import {
    openTestCase,
    rangeFromPosition,
    typeTreeProvider,
    waitForTypeTreeChildChange,
    withConfig,
} from "../testLibrary"

const arrayPos = rangeFromPosition(0, 15)
const arrayStringPos = rangeFromPosition(0, 25)

suite("Basic Tests", () => {
    test("select type at position", async () => {
        const { fileName } = await openTestCase("array.ts")
        extension.stateManager.selectTypeAtPosition(fileName, [arrayPos])

        const { children } = await waitForTypeTreeChildChange()

        assert(children.length === 1)
        const child = children[0]

        assert.strictEqual(child.label, "arrayOfStrings")
        assert.strictEqual(child.description, "string[]")

        assert(child.iconPath instanceof vscode.ThemeIcon)
        assert.strictEqual(child.iconPath.id, "symbol-string")
    })

    test("tree refreshes on icon disable config change", async () => {
        const { fileName } = await openTestCase("array.ts")
        extension.stateManager.selectTypeAtPosition(fileName, [arrayPos])

        const { children } = await waitForTypeTreeChildChange()
        assert(children[0].iconPath)

        await withConfig(
            {
                "typescriptExplorer.typeTree.view.icons.enable": false,
            },
            async () => {
                const { children: updatedChildren } =
                    await waitForTypeTreeChildChange()
                assert(!updatedChildren[0].iconPath)
            }
        )
    })

    test("lock works", async () => {
        const { fileName } = await openTestCase("array.ts")
        extension.stateManager.selectTypeAtPosition(fileName, [arrayStringPos])

        const { children } = await waitForTypeTreeChildChange()
        assert(children[0].description === "string")

        await extension.stateManager.setSelectionLock(true)
        extension.stateManager.selectTypeAtPosition(fileName, [arrayPos])

        const children_updated = await typeTreeProvider().getChildren()
        assert(children_updated[0].description === "string")
    })
})
