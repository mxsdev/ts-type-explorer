"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
const api_1 = require("@ts-expand-type/api");
const ts_orig = __importStar(require("typescript"));
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
        proxy.getQuickInfoAtPosition = function (fileName, position) {
            var _a;
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
            if (prior) {
                prior.__displayString = (_a = prior.displayParts) === null || _a === void 0 ? void 0 : _a.map(({ text }) => text).join("");
                prior.__displayType = getDisplayType(typeChecker, sourceFile, node);
                prior.displayParts = undefined;
            }
            return prior;
        };
        return proxy;
    }
    return { create };
}
function getDisplayType(typeChecker, sourceFile, node) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol)
        return undefined;
    const type = (0, api_1.getSymbolType)(typeChecker, symbol, node);
    const expandedType = (0, api_1.recursivelyExpandType)(typeChecker, type);
    const typeString = (0, api_1.multilineTypeToString)(typeChecker, sourceFile, expandedType, undefined, ts_orig.NodeBuilderFlags.MultilineObjectLiterals | ts_orig.NodeBuilderFlags.InTypeAlias);
    return typeString;
}
module.exports = init;
//# sourceMappingURL=index.js.map