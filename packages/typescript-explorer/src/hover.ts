import { ExpandedQuickInfo } from '@ts-expand-type/typescript-explorer-tsserver/dist/types';
import { TSExplorer } from './config';
import * as vscode from 'vscode';
import { getTypescriptMd, toFileLocationRequestArgs } from './util';

export function registerTypeInfoHoverProvider(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('typescript', getTypeInfoHoverProvider())
    )
}

function getTypeInfoHoverProvider(): vscode.HoverProvider {
    return {
		async provideHover(document, position, token) {
			return await vscode.commands.executeCommand("typescript.tsserverRequest", "quickinfo-full", toFileLocationRequestArgs(document.fileName, position))
				.then((r) => {
					const { body } = (r as { body: ExpandedQuickInfo })

					const {__displayType, __displayString} = body ?? {}

					if(!TSExplorer.Config.isExpandedHover()) {
						if(__displayString) {
							return new vscode.Hover(getTypescriptMd(__displayString))
						}
					} else {
						if(__displayType) {
							return new vscode.Hover(getTypescriptMd(__displayType))
						}
					}

					return null
				})
		}
	}
}