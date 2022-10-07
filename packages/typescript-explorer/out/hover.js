"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTypeInfoHoverProvider = void 0;
const config_1 = require("./config");
const vscode = require("vscode");
const util_1 = require("./util");
function registerTypeInfoHoverProvider(context) {
    context.subscriptions.push(vscode.languages.registerHoverProvider('typescript', getTypeInfoHoverProvider()));
}
exports.registerTypeInfoHoverProvider = registerTypeInfoHoverProvider;
function getTypeInfoHoverProvider() {
    return {
        async provideHover(document, position, token) {
            return await vscode.commands.executeCommand("typescript.tsserverRequest", "quickinfo-full", (0, util_1.toFileLocationRequestArgs)(document.fileName, position))
                .then((r) => {
                const { body } = r;
                const { __displayType, __displayString } = body ?? {};
                if (!config_1.TSExplorer.Config.isExpandedHover()) {
                    if (__displayString) {
                        return new vscode.Hover((0, util_1.getTypescriptMd)(__displayString));
                    }
                }
                else {
                    if (__displayType) {
                        return new vscode.Hover((0, util_1.getTypescriptMd)(__displayType));
                    }
                }
                return null;
            });
        }
    };
}
//# sourceMappingURL=hover.js.map