import { TypeInfo } from '@ts-expand-type/api'
import assert = require('assert')
import { toEditorSettings } from 'typescript'
import * as vscode from 'vscode'
import { getQuickInfoAtPosition, showError } from '../util'
import { TypeTreeItem, TypeTreeProvider } from '../view/typeTreeView'
import { ViewProviders } from '../view/views'

export class StateManager {
    constructor() { }
    
    private typeTree: TypeInfo|undefined
    private typeTreeProvider?: TypeTreeProvider

    private selectionLocked: boolean = false

    init(context: vscode.ExtensionContext, { typeTreeProvider }: ViewProviders) {
        this.typeTreeProvider = typeTreeProvider

        vscode.window.onDidChangeTextEditorSelection((e) => {
            if(e.kind === vscode.TextEditorSelectionChangeKind.Command || !e.kind) {
                return
            }

            this.selectTypeAtPosition(e.textEditor.document.fileName, e.selections)
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

                    if(!editor) {
                        showError("No active text selection!")
                        return
                    }

                    this.selectTypeAtPosition(editor.document.fileName, [editor.selection], true)
                }
            )
        )
    }

    setTypeTree(typeTree: TypeInfo|undefined) {
        this.typeTree = typeTree
        this.typeTreeProvider?.refresh()
    }

    getTypeTree() {
        return this.typeTree
    }

    setSelectionLock(locked: boolean) {
        this.selectionLocked = locked
        vscode.commands.executeCommand("setContext", "typescriptExplorer.selection.locked", locked)
    }

    getSelectionLock() {
        return this.selectionLocked
    }

    selectTypeAtPosition(fileName: string, selections: readonly vscode.Selection[], ignoreSelectionLock: boolean = false) {
        if(this.getSelectionLock() && !ignoreSelectionLock) {
            return
        }

        if(selections.length === 0) {
            this.setTypeTree(undefined)
            return
        }    
        
        getQuickInfoAtPosition(fileName, selections[0].start)
            .then((body) => {
                const { __displayTree } = body ?? {}
                this.setTypeTree(__displayTree)
            })
    }
}