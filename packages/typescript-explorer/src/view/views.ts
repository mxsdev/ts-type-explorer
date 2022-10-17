import * as vscode from "vscode"
import { StateManager } from "../state/stateManager"
import { TypeTreeProvider } from "./typeTreeView"

export type ViewProviders = {
    typeTreeProvider: TypeTreeProvider,
}

export function createAndRegisterViews(context: vscode.ExtensionContext, stateManager: StateManager): ViewProviders {
    const typeTreeProvider = new TypeTreeProvider(stateManager)

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider(
            "type-tree",
            typeTreeProvider
        )
    )

    return { typeTreeProvider }
}