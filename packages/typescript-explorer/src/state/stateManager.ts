import { TypeInfo } from '@ts-expand-type/api'
import * as vscode from 'vscode'
import { getQuickInfoAtPosition } from '../util'
import { TypeTreeProvider } from '../view/typeTreeView'
import { ViewProviders } from '../view/views'

export class StateManager {
    constructor() { }
    
    private typeTree: TypeInfo|undefined
    private typeTreeProvider?: TypeTreeProvider

    init(context: vscode.ExtensionContext, { typeTreeProvider }: ViewProviders) {
        this.typeTreeProvider = typeTreeProvider

        vscode.window.onDidChangeTextEditorSelection((e) => {
            if(e.selections.length === 0 || e.kind === vscode.TextEditorSelectionChangeKind.Command || !e.kind) {
                return
            }

            getQuickInfoAtPosition(e.textEditor.document.fileName, e.selections[0].start)
                .then((body) => {
                    const { __displayTree } = body ?? {}
                    this.setTypeTree(__displayTree)
                })
        })

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "typescript-explorer.refreshTypeTreeView",
                 () => typeTreeProvider.refresh()
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
}