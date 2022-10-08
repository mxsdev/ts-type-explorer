import * as vscode from "vscode"
import { StateManager } from "../state/stateManager"
import { TypeTreeProvider } from "./typeTreeView"

export function createAndRegisterViews(context: vscode.ExtensionContext, stateManager: StateManager) {
    const typeTreeProvider = new TypeTreeProvider(stateManager)

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider(
            "type-tree",
            typeTreeProvider
        )
    )

    return { typeTreeProvider }
}