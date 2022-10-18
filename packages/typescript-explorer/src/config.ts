import * as vscode from 'vscode'

export namespace TSExplorer {
    export namespace Config {
        const getBoolean = (id: string, defaultValue?: boolean) => () => !!config().get(id, defaultValue)
        const toggleBoolean = (id: string, defaultValue?: boolean) => async () => config().update(id, !getBoolean(id, defaultValue)())
        const configBoolean = (id: string, defaultValue?: boolean) => ({ get: getBoolean(id, defaultValue), toggle: toggleBoolean(id) })

        export namespace TypeTreeView {
            export const { get: iconsEnabled, toggle: toggleIconsEnabled } = configBoolean("typescript-explorer.typeTree.view.icons.enable")
            export const { get: iconColorsEnabled, toggle: toggleIconColorsEnabled } = configBoolean("typescript-explorer.typeTree.view.icons.colors.enable")
            export const { get: showTypeParameterInfo, toggle: toggleShowTypeParameterInfo } = configBoolean("typescript-explorer.typeTree.view.typeParameters.info.show")
        }

        export function toggleExpandedHover() {
			config().update('typescript-explorer.expandedHover', !isExpandedHover(), true)
        }

        export function isExpandedHover() {
            const { defaultValue, globalValue } = config().inspect<boolean>('typescript-explorer.expandedHover') ?? {}
            return globalValue ?? defaultValue ?? false
        }
    }
}

function config() {
    return vscode.workspace.getConfiguration()
}