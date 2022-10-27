import { ExpandedQuickInfo } from "@ts-type-explorer/typescript-plugin/dist/types"
import * as vscode from "vscode"
import type * as ts from "typescript"
import { SourceFileLocation, TypeInfo } from "@ts-type-explorer/api"

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

export function getQuickInfoAtLocation(location: SourceFileLocation) {
    return getQuickInfoAtPosition(
        location.fileName,
        positionFromLineAndCharacter(location.range.start)
    )
}

export function getTypeTreeAtLocation(
    location: SourceFileLocation
): Promise<TypeInfo | undefined> {
    return getQuickInfoAtLocation(location).then((data) => data?.__displayTree)
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

export function isDocumentSupported({ languageId }: vscode.TextDocument) {
    return languageId === "typescript" || languageId === "javascript"
}
