import * as vscode from "vscode"
import { mapObject } from "./functionalUtil"
import { smartlySetConfigValue } from "./util"
import { ViewProviders } from "./view/views"

const typeTreeConfigBoolean = {
    iconsEnabled: ["typescriptExplorer.typeTree.view.icons.enable"],
    iconColorsEnabled: ["typescriptExplorer.typeTree.view.icons.colors.enable"],
    showTypeParameterInfo: [
        "typescriptExplorer.typeTree.view.show.typeParameters",
    ],
    showBaseClassInfo: ["typescriptExplorer.typeTree.view.show.baseClass"],
    selectionEnabled: ["typescriptExplorer.typeTree.selection.enable", false],
    readonlyEnabled: ["typescriptExplorer.typeTree.readonly.enable"],
} as const

const basicConfig = {
    dialogueErrors: "typescriptExplorer.errorMessages.showDialogue",
    logErrors: "typescriptExplorer.errorMessages.log",
} as const

const getBoolean = (id: string, defaultValue?: boolean) => () =>
    !!config().get(id, defaultValue)
const toggleBoolean = (id: string, defaultValue?: boolean) => () =>
    smartlySetConfigValue(id, !getBoolean(id, defaultValue)(), config())
const exportBooleanConfig = (id: string, defaultValue?: boolean) =>
    ({
        get: getBoolean(id, defaultValue),
        toggle: toggleBoolean(id),
    } as const)

const typeTreeConfig = [...Object.values(typeTreeConfigBoolean)]

export function registerConfig(
    context: vscode.ExtensionContext,
    viewProviders: ViewProviders
) {
    const { typeTreeProvider } = viewProviders

    typeTreeConfig.forEach(([configId, refresh = true]) => {
        if (!refresh) return

        vscode.workspace.onDidChangeConfiguration(
            (event) => {
                if (event.affectsConfiguration(configId)) {
                    typeTreeProvider.refresh()
                }
            },
            undefined,
            context.subscriptions
        )
    })
}

export const {
    iconColorsEnabled,
    iconsEnabled,
    selectionEnabled,
    showBaseClassInfo,
    showTypeParameterInfo,
    readonlyEnabled,
    logErrors,
    dialogueErrors,
} = {
    ...mapObject(typeTreeConfigBoolean, ({ value: [id] }) =>
        exportBooleanConfig(id)
    ),
    ...mapObject(basicConfig, ({ value: id }) => exportBooleanConfig(id)),
}

function config() {
    return vscode.workspace.getConfiguration()
}
