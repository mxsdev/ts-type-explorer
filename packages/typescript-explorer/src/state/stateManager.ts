import { TypeInfo } from '@ts-expand-type/api'
import * as vscode from 'vscode'
import { getQuickInfoAtPosition } from '../util'
import { TypeTreeProvider } from '../view/typeTreeView'

export class StateManager {
    constructor() { }
    
    private typeTree: TypeInfo|undefined
    private typeTreeProvider?: TypeTreeProvider

    init(typeTreeProvider: TypeTreeProvider) {
        this.typeTreeProvider = typeTreeProvider

        vscode.window.onDidChangeTextEditorSelection((e) => {
            if(e.selections.length === 0) {
                return
            }

            getQuickInfoAtPosition(e.textEditor.document.fileName, e.selections[0].start)
                .then((body) => {
                    const { __displayTree } = body ?? {}
                    this.setTypeTree(__displayTree)
                })
        })
    }

    setTypeTree(typeTree: TypeInfo|undefined) {
        this.typeTree = typeTree
        this.typeTreeProvider?.refresh()
    }

    getTypeTree() {
        return this.typeTree
    }
}