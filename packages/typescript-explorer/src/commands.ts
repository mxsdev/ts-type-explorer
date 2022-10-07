import { TSExplorer } from "./config";
import * as vscode from 'vscode'

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
		vscode.commands.registerCommand('typescript-explorer.toggleExpandedHover', TSExplorer.Config.toggleExpandedHover)
	)
}