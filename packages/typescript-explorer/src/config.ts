import * as vscode from 'vscode'
import { smartlySetConfigValue } from './util'

export namespace TSExplorer {
    export namespace Config {
        const getBoolean = (id: string, defaultValue?: boolean) => () => !!config().get(id, defaultValue)
        const toggleBoolean = (id: string, defaultValue?: boolean) => () => smartlySetConfigValue(id, !getBoolean(id, defaultValue)(), config())
        const configBoolean = (id: string, defaultValue?: boolean) => ({ get: getBoolean(id, defaultValue), toggle: toggleBoolean(id) })

        export namespace TypeTreeView {
            export const { get: iconsEnabled, toggle: toggleIconsEnabled } = configBoolean("typescriptExplorer.typeTree.view.icons.enable")
            export const { get: iconColorsEnabled, toggle: toggleIconColorsEnabled } = configBoolean("typescriptExplorer.typeTree.view.icons.colors.enable")
            export const { get: showTypeParameterInfo, toggle: toggleShowTypeParameterInfo } = configBoolean("typescriptExplorer.typeTree.view.show.typeParameters")
            export const { get: showBaseClassInfo, toggle: toggleShowBaseClassInfo } = configBoolean("typescriptExplorer.typeTree.view.show.baseClass")
        }
    }
}

function config() {
    return vscode.workspace.getConfiguration()
}