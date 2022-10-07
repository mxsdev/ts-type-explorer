"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const hover_1 = require("./hover");
const commands_1 = require("./commands");
function activate(context) {
    (0, commands_1.registerCommands)(context);
    (0, hover_1.registerTypeInfoHoverProvider)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map