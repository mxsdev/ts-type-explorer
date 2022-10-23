import { TypeTreeChildrenUpdateInfo } from "./../view/typeTreeView"
import * as path from "path"
import * as vscode from "vscode"
import * as extension from "../extension"
import { TypeTreeItem } from "../view/typeTreeView"
import * as assert from "assert"

function testCasePath(fileName: string) {
    return path.join(__dirname, "../../../../tests/cases", fileName)
}

export async function openTestCase(testCase: string) {
    const textDocument = await vscode.workspace.openTextDocument(
        vscode.Uri.file(testCasePath(testCase))
    )

    await vscode.window.showTextDocument(textDocument)

    // wait for TS server to start
    await getDocumentSymbols(textDocument.uri)

    return textDocument
}

export async function closeAllEditors() {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors")
}

function getDocumentSymbols(uri: vscode.Uri) {
    return new Promise<vscode.SymbolInformation[]>((resolve) => {
        const timer = setInterval(() => {
            vscode.commands
                .executeCommand<vscode.SymbolInformation[] | undefined>(
                    "vscode.executeDocumentSymbolProvider",
                    uri
                )
                .then((s) => {
                    if (s) {
                        clearInterval(timer)
                        resolve(s)
                    }
                })
        }, 200)
    })
}

export function typeTreeProvider() {
    return extension.stateManager.typeTreeProvider!
}

export function focusTreeView() {
    return vscode.commands.executeCommand<void>("type-tree.focus")
}

type TypeTreeDataListener = (
    data: TypeTreeItem | undefined | null | void
) => void

const typeTreeListeners: TypeTreeDataListener[] = []
const typeTreeChildrenListeners: ((
    data: TypeTreeChildrenUpdateInfo
) => void)[] = []

export function initListeners() {
    typeTreeProvider().onDidChangeTreeData((data) => {
        typeTreeListeners.forEach((listener) => listener(data))
    })

    typeTreeProvider().onDidGetChildren((data) => {
        typeTreeChildrenListeners.forEach((listener) => listener(data))
    })
}

export function clearListeners() {
    clearArray(typeTreeListeners)
    clearArray(typeTreeChildrenListeners)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onTypeTreeDataDidChange(listener: TypeTreeDataListener) {
    typeTreeListeners.push(listener)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function removeTypeTreeDataChangeListener(listener: TypeTreeDataListener) {
    removeElement(typeTreeListeners, listener)
}

function onTypeTreeDataGetChildren(
    listener: (data: TypeTreeChildrenUpdateInfo) => void
) {
    typeTreeChildrenListeners.push(listener)
}

function removeTypeTreeDataChildrenListener(
    listener: (data: TypeTreeChildrenUpdateInfo) => void
) {
    removeElement(typeTreeChildrenListeners, listener)
}

export function waitForTypeTreeChildChange() {
    return new Promise<TypeTreeChildrenUpdateInfo>((resolve) => {
        const listener = (data: TypeTreeChildrenUpdateInfo): void => {
            resolve(data)
            removeTypeTreeDataChildrenListener(listener)
        }

        onTypeTreeDataGetChildren(listener)
    })
}

function removeElement<T>(arr: T[], element: T) {
    const index = arr.indexOf(element)
    assert(index >= 0)

    arr.splice(index, 1)
}

function clearArray<T>(arr: T[]) {
    arr.splice(0, arr.length)
}

const configUpdateStack: [section: string, global: boolean][] = []

export function updateConfig<T>(section: string, value: T, global = true) {
    configUpdateStack.push([section, global])
    return vscode.workspace.getConfiguration().update(section, value, global)
}

export async function clearConfigUpdates() {
    await Promise.all(
        configUpdateStack
            .reverse()
            .map(([section, global]) =>
                vscode.workspace
                    .getConfiguration()
                    .update(section, undefined, global)
            )
    )

    clearArray(configUpdateStack)
}

export function rangeFromPosition(line: number, character: number) {
    return new vscode.Range(
        new vscode.Position(line, character),
        new vscode.Position(line, character)
    )
}
