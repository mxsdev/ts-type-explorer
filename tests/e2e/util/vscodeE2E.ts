import path from "path"
import { CustomTreeItem, TextEditor, TreeItem } from "wdio-vscode-service"
import { openFile } from "./file"
import { VscodeTypeTreeView } from "./vscodeTypeTree"

export namespace VscodeE2E {
    export function test(cb: (tree: VscodeTypeTreeView) => Promise<void>) {
        return async () => {
            const tree = await VscodeTypeTreeView.create(browser)
            await cb(tree)
        }
    }

    function testFile(file: string) {
        return (
            cb: (tree: VscodeTypeTreeView, editor: TextEditor) => Promise<void>
        ) =>
            VscodeE2E.test(async (tree) => {
                const editor = await openFile(
                    await browser.getWorkbench(),
                    file
                )
                await cb(tree, editor)
            })
    }

    export function testCase(fileName: string) {
        return testRoot(path.join(__dirname, "../../cases", fileName))
    }

    function testRoot(file: string) {
        return (
            line: number,
            column: number,
            label: string,
            cb: (
                root: TreeItem,
                tree: VscodeTypeTreeView,
                editor: TextEditor
            ) => Promise<void>
        ) =>
            testFile(file)(async (tree, editor) => {
                await editor.moveCursor(line, column)
                const root = await tree.waitRoot(label)

                expect(await root.getLabel()).toBe(label)
                await cb(root, tree, editor)
            })
    }
}

export async function waitChildren(item: TreeItem): Promise<TreeItem[]> {
    await browser.waitUntil(async () => {
        return (await item.getChildren()).length > 0
    })

    return await item.getChildren()
}
