import * as assert from "assert"
import * as vscode from "vscode"
import * as extension from "../../extension"
import {
    openTestCase,
    rangeFromPosition,
    typeTreeProvider,
    updateConfig,
    waitForTypeTreeChildChange,
} from "../testLibrary"

const funcPos = rangeFromPosition(0, 24)

suite("Promise args", () => {
    test("has simple type args", async () => {
        const { fileName } = await openTestCase("promiseFunction.ts")
        extension.stateManager.selectTypeAtPosition(fileName, [funcPos])

        await waitForTypeTreeChildChange()
        const { children } = await waitForTypeTreeChildChange()

        const item = await extension.stateManager.typeTreeProvider?.getTreeItem(
            children[0]
        )

        assert(item?.description === "Promise<string> (object)")
    })
})
