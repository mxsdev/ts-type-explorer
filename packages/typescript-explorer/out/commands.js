"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const config_1 = require("./config");
const vscode = require("vscode");
function registerCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('typescript-explorer.toggleExpandedHover', config_1.TSExplorer.Config.toggleExpandedHover));
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=commands.js.map