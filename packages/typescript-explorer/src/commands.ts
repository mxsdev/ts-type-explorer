import { ViewProviders } from './view/views';
import { TSExplorer } from "./config";
import * as vscode from 'vscode'
import { TypeTreeProvider } from './view/typeTreeView';

type CommandHandler = (...args: any[]) => void|Thenable<void>
type CommandInfo = [id: string, handler: CommandHandler]

const normalCommands: CommandInfo[] = [ ]

const typeTreeViewCommands: RefreshableCommandInfo[] = [
	["typescriptExplorer.typeTree.view.icons.enabled.toggle", "typescriptExplorer.typeTree.view.icons.enable", TSExplorer.Config.TypeTreeView.toggleIconsEnabled],
	["typescriptExplorer.typeTree.view.icons.colors.enabled.toggle", "typescriptExplorer.typeTree.view.icons.colors.enable", TSExplorer.Config.TypeTreeView.toggleIconColorsEnabled],
	["typescriptExplorer.typeTree.view.show.typeParameters.toggle", "typescriptExplorer.typeTree.view.show.typeParameters", TSExplorer.Config.TypeTreeView.toggleShowTypeParameterInfo],
	["typescriptExplorer.typeTree.view.show.baseClass.toggle", "typescriptExplorer.typeTree.view.show.baseClass", TSExplorer.Config.TypeTreeView.toggleShowBaseClassInfo],
	["typescriptExplorer.typeTree.selection.enable.toggle", "typescriptExplorer.typeTree.selection.enable", TSExplorer.Config.TypeTreeView.toggleSelectionEnabled, false ]
]

export function registerCommands(context: vscode.ExtensionContext, { typeTreeProvider }: ViewProviders) {
	const commands = [
		...normalCommands,
		...typeTreeViewCommands.map(t => wrapRefresh(context, t, typeTreeProvider))
	]

	commands.forEach(c => registerCommand(c, context))
}

type RefreshableCommandInfo = [id: string, configId: string, handler: CommandHandler, refresh?: boolean]

function wrapRefresh(context: vscode.ExtensionContext, command: RefreshableCommandInfo, refreshable: {refresh(): void}): CommandInfo {
	const [id, configId, handler, refresh] = command

	if(!refresh) {
		return [id, handler]
	}

	vscode.workspace.onDidChangeConfiguration((event) => {
		if(event.affectsConfiguration(configId)) {
			refreshable.refresh()
		}
	}, undefined, context.subscriptions)

	return [id, handler]
}

function registerCommand([id, handler]: CommandInfo, context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(id, handler)
	)
}