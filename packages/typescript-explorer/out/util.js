"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypescriptMd = exports.toFileLocationRequestArgs = void 0;
const vscode = require("vscode");
const toFileLocationRequestArgs = (file, position) => ({
    file,
    line: position.line + 1,
    offset: position.character + 1,
});
exports.toFileLocationRequestArgs = toFileLocationRequestArgs;
function getTypescriptMd(code) {
    const mds = new vscode.MarkdownString();
    mds.appendCodeblock(code, 'typescript');
    return mds;
}
exports.getTypescriptMd = getTypescriptMd;
//# sourceMappingURL=util.js.map