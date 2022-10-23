import { TypeInfo } from "@ts-expand-type/api"
import * as vscode from "vscode"
import { selectionEnabled } from "../config"
import { getQuickInfoAtPosition, showError } from "../util"
import { TypeTreeItem, TypeTreeProvider } from "../view/typeTreeView"
import { ViewProviders } from "../view/views"

export class StateManager {
    public typeTree: TypeInfo | undefined
    public typeTreeProvider?: TypeTreeProvider

    private selectionLocked = false
    private selectionEnabled = true

    public initialized = false

    init(
        context: vscode.ExtensionContext,
        { typeTreeProvider }: ViewProviders
    ) {
        this.typeTreeProvider = typeTreeProvider

        this.updateSelectionContext()

        vscode.workspace.onDidChangeConfiguration(
            (event) => {
                if (
                    event.affectsConfiguration(
                        "typescriptExplorer.typeTree.selection.enable"
                    )
                ) {
                    this.updateSelectionContext()
                }
            },
            undefined,
            context.subscriptions
        )

        vscode.window.onDidChangeTextEditorSelection((e) => {
            if (
                e.kind === vscode.TextEditorSelectionChangeKind.Command ||
                !e.kind
            ) {
                return
            }

            this.selectTypeAtPosition(
                e.textEditor.document.fileName,
                e.selections
            )
        })

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.typeTree.view.refresh",
                () => typeTreeProvider.refresh()
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.typeTree.view.find",
                () => vscode.commands.executeCommand("list.find")
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.typeTree.view.declared.goTo",
                (item: TypeTreeItem) => item.goToDefinition()
            )
        )

        this.setSelectionLock(this.selectionLocked)

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.selection.lock",
                () => this.setSelectionLock(true)
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.selection.unlock",
                () => this.setSelectionLock(false)
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescriptExplorer.selection.select",
                () => {
                    const editor = vscode.window.activeTextEditor

                    if (!editor) {
                        showError("No active text selection!")
                        return
                    }

                    this.selectTypeAtPosition(
                        editor.document.fileName,
                        [editor.selection],
                        true
                    )
                }
            )
        )

        // make selection on open
        if (
            this.selectionEnabled &&
            vscode.window.activeTextEditor?.document.languageId === "typescript"
        ) {
            vscode.commands.executeCommand(
                "typescriptExplorer.selection.select"
            )
        }

        this.initialized = true
    }

    setTypeTree(typeTree: TypeInfo | undefined) {
        this.typeTree = typeTree
        this.typeTreeProvider?.refresh()
    }

    getTypeTree() {
        return this.typeTree
    }

    private updateSelectionContext() {
        this.selectionEnabled = selectionEnabled()
        vscode.commands.executeCommand(
            "setContext",
            "typescriptExplorer.selection.enabled",
            this.selectionEnabled
        )
    }

    setSelectionLock(locked: boolean) {
        this.selectionLocked = locked

        return vscode.commands.executeCommand<void>(
            "setContext",
            "typescriptExplorer.selection.locked",
            locked
        )
    }

    getSelectionLock() {
        return this.selectionLocked || !this.selectionEnabled
    }

    async selectTypeAtPosition(
        fileName: string,
        selections: readonly vscode.Range[],
        ignoreSelectionLock = false
    ) {
        if (this.getSelectionLock() && !ignoreSelectionLock) {
            return
        }

        if (selections.length === 0) {
            this.setTypeTree(undefined)
            return
        }

        return getQuickInfoAtPosition(fileName, selections[0].start)
            .then((body) => {
                const { __displayTree } = body ?? {}
                this.setTypeTree(__displayTree)
            })
            .catch((e) => {
                showError("Error getting quick info")
                console.error("Quick info error", e)
            })
    }
}
