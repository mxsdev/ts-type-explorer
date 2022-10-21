import * as vscode from 'vscode'

export namespace TSExplorer {
    export namespace Config {
        const getBoolean = (id: string, defaultValue?: boolean) => () => !!config().get(id, defaultValue)
        // TODO: smartly set config value based on user config status
        const toggleBoolean = (id: string, defaultValue?: boolean) => async () => config().update(id, !getBoolean(id, defaultValue)())
        const configBoolean = (id: string, defaultValue?: boolean) => ({ get: getBoolean(id, defaultValue), toggle: toggleBoolean(id) })

        export namespace TypeTreeView {
            export const { get: iconsEnabled, toggle: toggleIconsEnabled } = configBoolean("typescriptExplorer.typeTree.view.icons.enable")
            export const { get: iconColorsEnabled, toggle: toggleIconColorsEnabled } = configBoolean("typescriptExplorer.typeTree.view.icons.colors.enable")
            export const { get: showTypeParameterInfo, toggle: toggleShowTypeParameterInfo } = configBoolean("typescriptExplorer.typeTree.view.show.typeParameters")
            export const { get: showBaseClassInfo, toggle: toggleShowBaseClassInfo } = configBoolean("typescriptExplorer.typeTree.view.show.baseClass")
        }

        export function toggleExpandedHover() {
			config().update('typescriptExplorer.expandedHover.enable', !isExpandedHover(), true)
        }

        export function isExpandedHover() {
            const { defaultValue, globalValue } = config().inspect<boolean>('typescriptExplorer.expandedHover.enable') ?? {}
            return globalValue ?? defaultValue ?? false
        }
    }
}

function config() {
    return vscode.workspace.getConfiguration()
}