import { ViewProviders } from './view/views';
import { TSExplorer } from "./config";
import * as vscode from 'vscode'
import { TypeTreeProvider } from './view/typeTreeView';

type CommandHandler = (...args: any[]) => void|Thenable<void>
type CommandInfo = [id: string, handler: CommandHandler]

const normalCommands: CommandInfo[] = [ ]

const typeTreeViewCommands: RefreshableCommandInfo[] = [
	["typescriptExplorer.typeTree.view.icons.enabled.toggle", TSExplorer.Config.TypeTreeView.toggleIconsEnabled],
	["typescriptExplorer.typeTree.view.icons.colors.enabled.toggle", TSExplorer.Config.TypeTreeView.toggleIconColorsEnabled],
	["typescriptExplorer.typeTree.view.show.typeParameters.toggle", TSExplorer.Config.TypeTreeView.toggleShowTypeParameterInfo],
	["typescriptExplorer.typeTree.view.show.baseClass.toggle", TSExplorer.Config.TypeTreeView.toggleShowBaseClassInfo]
]

export function registerCommands(context: vscode.ExtensionContext, { typeTreeProvider }: ViewProviders) {
	const commands = [
		...normalCommands,
		...typeTreeViewCommands.map(t => wrapRefresh(t, typeTreeProvider))
	]

	commands.forEach(c => registerCommand(c, context))
}

type RefreshableCommandInfo = CommandInfo | [...CommandInfo, boolean]

function wrapRefresh(command: RefreshableCommandInfo, refreshable: {refresh(): void}): CommandInfo {
	const [id, handler, refresh=true] = command

	if(!refresh) {
		return [id, handler]
	}

	return [id, async () => {
		await handler()
		refreshable.refresh()
	}]
}

function registerCommand([id, handler]: CommandInfo, context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(id, handler)
	)
}