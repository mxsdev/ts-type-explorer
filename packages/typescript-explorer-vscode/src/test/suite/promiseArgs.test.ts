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

suite("Promise args", () => {
    test("has simple type args", async () => {
        const { fileName } = await openTestCase("promiseFunction.ts")
        extension.stateManager.selectTypeAtPosition(fileName, [
            rangeFromPosition(0, 24),
        ])

        await waitForTypeTreeChildChange()
        const { children } = await waitForTypeTreeChildChange()

        const item = await extension.stateManager.typeTreeProvider?.getTreeItem(
            children[0]
        )

        assert(item?.description === "Promise<string> (object)")
    })

    test(
        "works for functions",
        withConfig(
            {
                "typescriptExplorer.typeTree.meta.typeArguments.includeInFunctions":
                    true,
            },
            async () => {
                const { fileName } = await openTestCase("mapArray.ts")
                extension.stateManager.selectTypeAtPosition(fileName, [
                    rangeFromPosition(0, 20),
                ])

                const { children } = await waitForTypeTreeChildChange()
                await waitForTypeTreeChildChange()

                const item =
                    await extension.stateManager.typeTreeProvider?.getTreeItem(
                        children[0]
                    )

                assert(item?.label === "map<string>")
            }
        )
    )
})
