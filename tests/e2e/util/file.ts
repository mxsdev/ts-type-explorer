import { TextEditor, Workbench } from "wdio-vscode-service"

export async function openFile(workbench: Workbench, filename: string) {
    const editorView = workbench.getEditorView()
    await editorView.closeAllEditors()

    const commandPrompt = await workbench.openCommandPrompt()
    await commandPrompt.setText(filename)
    await commandPrompt.confirm()

    const activeTab = await editorView.getActiveTab()
    expect(activeTab)

    const editor = (await editorView.openEditor(
        await activeTab!.getTitle()
    )) as TextEditor

    return editor
}
