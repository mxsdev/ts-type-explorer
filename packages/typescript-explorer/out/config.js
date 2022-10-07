"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSExplorer = void 0;
const vscode = require("vscode");
var TSExplorer;
(function (TSExplorer) {
    let Config;
    (function (Config) {
        function toggleExpandedHover() {
            config().update('typescript-explorer.expandedHover', !isExpandedHover(), true);
        }
        Config.toggleExpandedHover = toggleExpandedHover;
        function isExpandedHover() {
            const { defaultValue, globalValue } = config().inspect('typescript-explorer.expandedHover') ?? {};
            return globalValue ?? defaultValue ?? false;
        }
        Config.isExpandedHover = isExpandedHover;
    })(Config = TSExplorer.Config || (TSExplorer.Config = {}));
})(TSExplorer = exports.TSExplorer || (exports.TSExplorer = {}));
function config() {
    return vscode.workspace.getConfiguration();
}
//# sourceMappingURL=config.js.map