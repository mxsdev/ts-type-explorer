import { TextEditor } from "wdio-vscode-service"
import { openFile } from "./file"
import { VscodeTypeTreeView } from "./vscodeTypeTree"

export namespace VscodeE2E {
    export function test(cb: (tree: VscodeTypeTreeView) => Promise<void>) {
        return async () => {
            const tree = await VscodeTypeTreeView.create(browser)
            await cb(tree)
        }
    }

    export function testFile(
        file: string,
        cb: (tree: VscodeTypeTreeView, editor: TextEditor) => Promise<void>
    ) {
        return VscodeE2E.test(async (tree) => {
            const editor = await openFile(await browser.getWorkbench(), file)
            await cb(tree, editor)
        })
    }
}
