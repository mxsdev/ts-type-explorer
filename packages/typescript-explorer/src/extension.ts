import * as vscode from 'vscode';
import { registerTypeInfoHoverProvider } from "./hover";
import { registerCommands } from "./commands";

export function activate(context: vscode.ExtensionContext) {
	registerCommands(context)
	registerTypeInfoHoverProvider(context)
}

export function deactivate() {}