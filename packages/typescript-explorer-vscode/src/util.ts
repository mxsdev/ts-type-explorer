import * as vscode from "vscode"
import type * as ts from "typescript"
import {
    CustomTypeScriptRequestId,
    CustomTypeScriptRequestOfId,
    CustomTypeScriptResponse,
    SourceFileLocation,
    TextRange,
    TypeInfo,
} from "@ts-type-explorer/api"
import type * as Proto from "typescript/lib/protocol"

export const positionToLineAndCharacter = (
    position: vscode.Position
): ts.LineAndCharacter => ({
    line: position.line,
    character: position.character,
})

export const rangeToTextRange = (range: vscode.Range): TextRange => ({
    start: positionFromLineAndCharacter(range.start),
    end: positionFromLineAndCharacter(range.end),
})

const toFileLocationRequestArgs = (
    file: string,
    position: vscode.Position
): Proto.FileLocationRequestArgs => ({
    file,
    line: position.line + 1,
    offset: position.character + 1,
})

const positionFromLineAndCharacter = ({
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

async function getQuickInfoAtPosition(
    fileName: string,
    position: vscode.Position
) {
    return await vscode.commands
        .executeCommand(
            "typescript.tsserverRequest",
            "quickinfo-full",
            toFileLocationRequestArgs(fileName, position)
        )
        .then((r) => (r as Proto.QuickInfoResponse).body)
}

async function customTypescriptRequest<Id extends CustomTypeScriptRequestId>(
    fileName: string,
    position: vscode.Position,
    request: CustomTypeScriptRequestOfId<Id>
): Promise<CustomTypeScriptResponse<Id> | undefined> {
    return await vscode.commands.executeCommand(
        "typescript.tsserverRequest",
        "completionInfo",
        {
            ...toFileLocationRequestArgs(fileName, position),
            /**
             * We override the "triggerCharacter" property here as a hack so
             * that we can send custom commands to TSServer
             */
            triggerCharacter: request,
        }
    )
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
    return getTypeTreeAtRange(
        location.fileName,
        rangeFromLineAndCharacters(location.range.start, location.range.end)
    )
}

export function getTypeTreeAtRange(
    fileName: string,
    range: vscode.Range
): Promise<TypeInfo | undefined> {
    return customTypescriptRequest(
        fileName,
        positionFromLineAndCharacter(range.start),
        {
            id: "type-tree",
            range: rangeToTextRange(range),
        }
    ).then((res) => res?.body.__tsExplorerResponse?.typeInfo)
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
    return (
        languageId === "typescript" ||
        languageId === "javascript" ||
        languageId === "typescriptreact" ||
        languageId === "javascriptreact"
    )
}
