import { recursiveMergeIntersection } from "./merge.js";
import { getTypeOrDeclaredType, resolvedTypeToString } from "./util.js";
export default function init(modules) {
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
            var _a, _b;
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            const program = info.project['program'];
            if (!program) {
                return prior;
            }
            const typeChecker = program.getTypeChecker();
            const sourceFile = program.getSourceFile(fileName);
            // @ts-expect-error
            const node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node || node === sourceFile) {
                // Avoid giving quickInfo for the sourceFile as a whole.
                return prior;
            }
            const symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                return prior;
            }
            const type = getTypeOrDeclaredType(typeChecker, symbol, node);
            const expandedType = recursiveMergeIntersection(typeChecker, type);
            (_a = prior === null || prior === void 0 ? void 0 : prior.displayParts) === null || _a === void 0 ? void 0 : _a.push({
                kind: 'lineBreak',
                text: "\n"
            });
            const typeString = resolvedTypeToString(typeChecker, expandedType);
            (_b = prior === null || prior === void 0 ? void 0 : prior.displayParts) === null || _b === void 0 ? void 0 : _b.push({
                kind: 'punctuation',
                text: typeString
            });
            return prior;
        };
        return proxy;
    }
    return { create };
}
