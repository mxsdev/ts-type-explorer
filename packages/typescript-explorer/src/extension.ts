import * as vscode from 'vscode';
import { registerTypeInfoHoverProvider } from "./hover";
import { registerCommands } from "./commands";
import { createAndRegisterViews } from './view/views';
import { StateManager } from './state/stateManager';

// TODO: add config for e.g. max depth

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context)
	registerTypeInfoHoverProvider(context)

	const stateManager = new StateManager()

	const { typeTreeProvider } = createAndRegisterViews(context, stateManager)

	stateManager.init(
		typeTreeProvider
	)
}

export function deactivate() {}