import * as vscode from 'vscode';
import { registerTypeInfoHoverProvider } from "./hover";
import { registerCommands } from "./commands";
import { createAndRegisterViews } from './view/views';
import { StateManager } from './state/stateManager';

// TODO: add config for e.g. max depth
// TODO: change command namespacing from "typescript-explorer.toggleTypeTreeIcons" to e.g. "typescriptExplorer.typeTree.toggleIcons"

export function activate(context: vscode.ExtensionContext) {
	const stateManager = new StateManager()
	
	const viewProviders = createAndRegisterViews(context, stateManager)
	
	registerCommands(context, viewProviders)
	registerTypeInfoHoverProvider(context)
	
	stateManager.init(
		context,
		viewProviders
	)
}

export function deactivate() {}