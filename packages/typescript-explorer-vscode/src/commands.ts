import { ViewProviders } from "./view/views"
import {
    toggleIconColorsEnabled,
    toggleIconsEnabled,
    toggleSelectionEnabled,
    toggleShowBaseClassInfo,
    toggleShowTypeParameterInfo,
} from "./config"
import * as vscode from "vscode"

type CommandHandler = (...args: unknown[]) => void | Thenable<void>
type CommandInfo = [id: string, handler: CommandHandler]

const normalCommands: CommandInfo[] = []

// TODO: refreshing on config should be done in config.ts, not here...

const typeTreeViewCommands: RefreshableCommandInfo[] = [
    [
        "typescriptExplorer.typeTree.view.icons.enabled.toggle",
        "typescriptExplorer.typeTree.view.icons.enable",
        toggleIconsEnabled,
    ],
    [
        "typescriptExplorer.typeTree.view.icons.colors.enabled.toggle",
        "typescriptExplorer.typeTree.view.icons.colors.enable",
        toggleIconColorsEnabled,
    ],
    [
        "typescriptExplorer.typeTree.view.show.typeParameters.toggle",
        "typescriptExplorer.typeTree.view.show.typeParameters",
        toggleShowTypeParameterInfo,
    ],
    [
        "typescriptExplorer.typeTree.view.show.baseClass.toggle",
        "typescriptExplorer.typeTree.view.show.baseClass",
        toggleShowBaseClassInfo,
    ],
    [
        "typescriptExplorer.typeTree.selection.enable.toggle",
        "typescriptExplorer.typeTree.selection.enable",
        toggleSelectionEnabled,
        false,
    ],
]

export function registerCommands(
    context: vscode.ExtensionContext,
    { typeTreeProvider }: ViewProviders
) {
    const commands = [
        ...normalCommands,
        ...typeTreeViewCommands.map((t) =>
            wrapRefresh(context, t, typeTreeProvider)
        ),
    ]

    commands.forEach((c) => registerCommand(c, context))
}

type RefreshableCommandInfo = [
    id: string,
    configId: string,
    handler: CommandHandler,
    refresh?: boolean
]

function wrapRefresh(
    context: vscode.ExtensionContext,
    command: RefreshableCommandInfo,
    refreshable: { refresh(): void }
): CommandInfo {
    const [id, configId, handler, refresh = true] = command

    if (!refresh) {
        return [id, handler]
    }

    vscode.workspace.onDidChangeConfiguration(
        (event) => {
            if (event.affectsConfiguration(configId)) {
                refreshable.refresh()
            }
        },
        undefined,
        context.subscriptions
    )

    return [id, handler]
}

function registerCommand(
    [id, handler]: CommandInfo,
    context: vscode.ExtensionContext
) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler))
}
