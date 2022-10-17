import { ViewProviders } from './view/views';
import { TSExplorer } from "./config";
import * as vscode from 'vscode'

export function registerCommands(context: vscode.ExtensionContext, ViewProviders: ViewProviders) {
    context.subscriptions.push(
		vscode.commands.registerCommand('typescript-explorer.toggleExpandedHover', TSExplorer.Config.toggleExpandedHover)
	)
}