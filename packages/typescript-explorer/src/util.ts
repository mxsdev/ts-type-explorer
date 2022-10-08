import { ExpandedQuickInfo } from '@ts-expand-type/typescript-explorer-tsserver/dist/types'
import * as vscode from 'vscode'

export const toFileLocationRequestArgs = (file: string, position: vscode.Position) => ({
	file,
	line: position.line + 1,
	offset: position.character + 1,
})

export function getTypescriptMd(code: string) {
	const mds = new vscode.MarkdownString()
	mds.appendCodeblock(code, 'typescript')
	return mds
}

export async function getQuickInfoAtPosition(fileName: string, position: vscode.Position) {
	return await vscode.commands.executeCommand("typescript.tsserverRequest", "quickinfo-full", toFileLocationRequestArgs(fileName, position))
		.then((r) => (r as { body: ExpandedQuickInfo|undefined }).body)
}