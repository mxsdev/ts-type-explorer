import {
    iconColorsEnabled,
    iconsEnabled,
    selectionEnabled,
    showBaseClassInfo,
    showTypeParameterInfo,
} from "./config"
import * as vscode from "vscode"

type CommandHandler = (...args: unknown[]) => void | Thenable<void>
type CommandInfo = [id: string, handler: CommandHandler]

const commandList: CommandInfo[] = [
    [
        "typescriptExplorer.typeTree.view.icons.enabled.toggle",
        iconsEnabled.toggle,
    ],
    [
        "typescriptExplorer.typeTree.view.icons.colors.enabled.toggle",
        iconColorsEnabled.toggle,
    ],
    [
        "typescriptExplorer.typeTree.view.show.typeParameters.toggle",
        showTypeParameterInfo.toggle,
    ],
    [
        "typescriptExplorer.typeTree.view.show.baseClass.toggle",
        showBaseClassInfo.toggle,
    ],
    [
        "typescriptExplorer.typeTree.selection.enable.toggle",
        selectionEnabled.toggle,
    ],
]

export function registerCommands(context: vscode.ExtensionContext) {
    const commands = [...commandList]

    commands.forEach((c) => registerCommand(c, context))
}

function registerCommand(
    [id, handler]: CommandInfo,
    context: vscode.ExtensionContext
) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler))
}
