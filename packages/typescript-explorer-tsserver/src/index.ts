import { getSymbolType, generateTypeTree, getNodeType, getNodeSymbol, getDescendantAtPosition } from "@ts-expand-type/api";
import type { ExpandedQuickInfo } from "./types";
import { isValidType } from "@ts-expand-type/api/dist/util";
import type * as ts from "typescript/lib/tsserverlibrary"

// TODO: add config for e.g. max depth

function init( /* modules: { typescript: typeof import("typescript/lib/tsserverlibrary") } */ ) {
    function create(info: ts.server.PluginCreateInfo) {
      // Set up decorator object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const proxy: ts.LanguageService = Object.create(null);
      for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
        const x = info.languageService[k]!;
        // @ts-expect-error - JS runtime trickery which is tricky to type tersely
        // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-return
        proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
      }

      proxy.getQuickInfoAtPosition = function (fileName, position) {
        let prior = info.languageService.getQuickInfoAtPosition(fileName, position) as ExpandedQuickInfo

        const program = info.project['program'] as ts.Program|undefined

        if(!program) return prior

        const typeChecker = program.getTypeChecker()
        const sourceFile = program.getSourceFile(fileName)

        if(!sourceFile) return prior

        const node = getDescendantAtPosition(sourceFile, position)

        if (!node || node === sourceFile) {
            // Avoid giving quickInfo for the sourceFile as a whole.
            return prior
        }

        if(!prior) {
          prior = { } as ExpandedQuickInfo
        }

        if(prior) {
            prior.__displayTree = getDisplayTree(typeChecker, node)
        }
        
        return prior
      }

      return proxy
    }

    return { create }
}

function getDisplayTree(typeChecker: ts.TypeChecker, node: ts.Node) {
  const symbol = typeChecker.getSymbolAtLocation(node) ?? getNodeSymbol(typeChecker, node)

  if(symbol) {
    const symbolType = getSymbolType(typeChecker, symbol, node)

    if(isValidType(symbolType)) {
      return generateTypeTree({ symbol, node }, typeChecker)
    }
  }

  const type = getNodeType(typeChecker, node)

  if(type) {
    return generateTypeTree({ type, node }, typeChecker)
  }

  return undefined
}

export = init