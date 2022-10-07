"use strict";
const api_1 = require("@ts-expand-type/api");
function init(modules) {
    const ts = modules.typescript;
    function create(info) {
        const config = getConfig(info.config);
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
            const type = (0, api_1.getSymbolType)(typeChecker, symbol, node);
            const expandedType = (0, api_1.recursivelyExpandType)(typeChecker, type);
            if (!(prior === null || prior === void 0 ? void 0 : prior.displayParts))
                return prior;
            if (!config.includeOriginal) {
                prior.displayParts = [];
            }
            else {
                prior.displayParts.push({ kind: 'lineBreak', text: "\n\n" });
            }
            if (config.typePrefix) {
                prior.displayParts.push({ kind: 'punctuation', text: '(' });
                prior.displayParts.push({ kind: 'text', text: 'type' });
                prior.displayParts.push({ kind: 'punctuation', text: ')' });
                prior.displayParts.push({ kind: 'space', text: ' ' });
            }
            let typeFormatFlags = 0;
            if (config.multilineObjectLiterals) {
                typeFormatFlags |= ts.NodeBuilderFlags.MultilineObjectLiterals;
            }
            const typeString = (0, api_1.multilineTypeToString)(typeChecker, sourceFile, expandedType, undefined, typeFormatFlags);
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
function getConfig(config) {
    var _a, _b, _c;
    const includeOriginal = (_a = config.includeOriginal) !== null && _a !== void 0 ? _a : false;
    return {
        multilineObjectLiterals: (_b = config.multilineObjectLiterals) !== null && _b !== void 0 ? _b : true,
        includeOriginal,
        typePrefix: (_c = config.typePrefix) !== null && _c !== void 0 ? _c : includeOriginal,
    };
}
module.exports = init;
//# sourceMappingURL=index.js.map