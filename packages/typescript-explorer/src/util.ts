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