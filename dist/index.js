"use strict";
const merge_1 = require("./merge");
const util_1 = require("./util");
function init(modules) {
    const ts = modules.typescript;
    function create(info) {
        // Set up decorator object
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        proxy.getQuickInfoAtPosition = (fileName, position) => {
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            const program = info.project['program'];
            if (!program)
                return prior;
            const typeChecker = program.getTypeChecker();
            const sourceFile = program.getSourceFile(fileName);
            if (!sourceFile)
                return prior;
            // @ts-expect-error
            const node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node || node === sourceFile) {
                // Avoid giving quickInfo for the sourceFile as a whole.
                return prior;
            }
            const symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol)
                return prior;
            const type = (0, util_1.getTypeOrDeclaredType)(typeChecker, symbol, node);
            const expandedType = (0, merge_1.recursiveMergeIntersection)(typeChecker, type);
            if (!(prior === null || prior === void 0 ? void 0 : prior.displayParts))
                return prior;
            prior.displayParts.push({ kind: 'lineBreak', text: "\n\n" });
            prior.displayParts.push({ kind: 'punctuation', text: '(' });
            prior.displayParts.push({ kind: 'text', text: 'type' });
            prior.displayParts.push({ kind: 'punctuation', text: ')' });
            prior.displayParts.push({ kind: 'space', text: ' ' });
            const typeString = (0, util_1.resolvedTypeToString)(typeChecker, sourceFile, expandedType, undefined, ts.TypeFormatFlags.MultilineObjectLiterals);
            typeString.split("\n").forEach(line => {
                prior.displayParts.push({
                    kind: 'punctuation',
                    text: line,
                });
                prior.displayParts.push({
                    kind: 'lineBreak',
                    text: "\n"
                });
            });
            return prior;
        };
        return proxy;
    }
    return { create };
}
module.exports = init;
//# sourceMappingURL=index.js.map