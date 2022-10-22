import { ExpandedQuickInfo } from "@ts-expand-type/typescript-explorer-tsserver/dist/types"
import * as vscode from "vscode"
import type * as ts from "typescript"

export const toFileLocationRequestArgs = (
    file: string,
    position: vscode.Position
) => ({
    file,
    line: position.line + 1,
    offset: position.character + 1,
})

export const fromFileLocationRequestArgs = (position: {
    line: number
    character: number
}) => ({
    line: position.line - 1,
    character: position.character - 1,
})

export const positionFromLineAndCharacter = ({
    line,
    character,
}: ts.LineAndCharacter) => new vscode.Position(line, character)

export const rangeFromLineAndCharacters = (
    start: ts.LineAndCharacter,
    end: ts.LineAndCharacter
) =>
    new vscode.Range(
        positionFromLineAndCharacter(start),
        positionFromLineAndCharacter(end)
    )

export function lineAndCharToPosition({
    line,
    character,
}: ts.LineAndCharacter): vscode.Position {
    return new vscode.Position(line, character)
}

export function getTypescriptMd(code: string) {
    const mds = new vscode.MarkdownString()
    mds.appendCodeblock(code, "typescript")
    return mds
}

export async function getQuickInfoAtPosition(
    fileName: string,
    position: vscode.Position
) {
    return await vscode.commands
        .executeCommand(
            "typescript.tsserverRequest",
            "quickinfo-full",
            toFileLocationRequestArgs(fileName, position)
        )
        .then((r) => (r as { body: ExpandedQuickInfo | undefined }).body)
}

/**
 * Smartly set configuration value based on workspace configuration. This will set
 * configuration on a workspace level if a workspace value has been set, and will
 * set it globally otherwise.
 *
 * This will also reset a config value if it is set to its default.
 *
 * @param id
 * @param value
 * @param config Config object to use, defaults to workspace configuration
 */
export function smartlySetConfigValue<T>(
    id: string,
    value: T,
    config?: vscode.WorkspaceConfiguration
) {
    config ??= vscode.workspace.getConfiguration()
    const { workspaceValue, defaultValue } = config.inspect<T>(id) ?? {}

    let setValue: T | undefined = value

    if (defaultValue !== undefined && defaultValue === value) {
        setValue = undefined
    }

    return config.update(id, setValue, workspaceValue === undefined)
}

export function showError(message: string) {
    vscode.window.showErrorMessage(message)
}
