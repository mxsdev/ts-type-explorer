import { ViewProviders } from './view/views';
import { TSExplorer } from "./config";
import * as vscode from 'vscode'
import { TypeTreeProvider } from './view/typeTreeView';

type CommandHandler = (...args: any[]) => void|Promise<void>
type CommandInfo = [id: string, handler: CommandHandler]

const normalCommands: CommandInfo[] = [
	["typescript-explorer.toggleExpandedHover", TSExplorer.Config.toggleExpandedHover],
]

const typeTreeViewCommands = (typeTreeProvider: TypeTreeProvider): CommandInfo[] => ([
	["typescript-explorer.typeTree.view.icons.enabled.toggle", TSExplorer.Config.TypeTreeView.toggleIconsEnabled],
	["typescript-explorer.typeTree.view.icons.colors.enabled.toggle", TSExplorer.Config.TypeTreeView.toggleIconColorsEnabled],
	["typescript-explorer.typeTree.view.typeParameters.info.show.toggle", TSExplorer.Config.TypeTreeView.toggleShowTypeParameterInfo],
] as RefreshableCommandInfo[]).map(t => wrapRefresh(t, typeTreeProvider))

export function registerCommands(context: vscode.ExtensionContext, { typeTreeProvider }: ViewProviders) {
	const commands = [
		...normalCommands,
		...typeTreeViewCommands(typeTreeProvider)
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