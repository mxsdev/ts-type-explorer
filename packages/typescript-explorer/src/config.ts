import * as vscode from 'vscode'

export namespace TSExplorer {
    export namespace Config {
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