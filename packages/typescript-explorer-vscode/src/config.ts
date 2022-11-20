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

const basicConfigBoolean = {
    dialogueErrors: "typescriptExplorer.errorMessages.showDialogue",
    logErrors: "typescriptExplorer.errorMessages.log",
    descriptionTypeArgumentsEnabled:
        "typescriptExplorer.typeTree.meta.typeArguments.enable",
    metaTypeArgumentsInFunction:
        "typescriptExplorer.typeTree.meta.typeArguments.includeInFunctions",
} as const

const basicConfigNumeric = {
    maxRecursionDepth: "typescriptExplorer.typeTree.maxRecursionDepth",
    descriptionTypeArgumentsMaxLength:
        "typescriptExplorer.typeTree.meta.typeArguments.maxLength",
}

const exportBooleanConfig = (id: string, defaultValue?: boolean) =>
    ({
        get: () => !!config().get(id, defaultValue),
        toggle: () =>
            smartlySetConfigValue(
                id,
                !config().get(id, defaultValue),
                config()
            ),
    } as const)

const exportNumericConfig = (id: string) => ({
    get: () => config().get<number>(id),
    set: (value: number | undefined) =>
        smartlySetConfigValue(id, value, config()),
})

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
    maxRecursionDepth,
    descriptionTypeArgumentsMaxLength,
    descriptionTypeArgumentsEnabled,
    metaTypeArgumentsInFunction,
} = {
    ...mapObject(typeTreeConfigBoolean, ({ value: [id] }) =>
        exportBooleanConfig(id)
    ),
    ...mapObject(basicConfigBoolean, ({ value: id }) =>
        exportBooleanConfig(id)
    ),
    ...mapObject(basicConfigNumeric, ({ value: id }) =>
        exportNumericConfig(id)
    ),
}

function config() {
    return vscode.workspace.getConfiguration()
}
