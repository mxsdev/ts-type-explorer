import { multilineTypeToString, getSymbolType, recursivelyExpandType, generateTypeTree, getNodeType, getNodeSymbol, getDescendantAtPosition } from "@ts-expand-type/api";
import type { ExpandedQuickInfo } from "./types";
import * as ts_orig from "typescript"
import { TypeChecker, Node } from "typescript/lib/tsserverlibrary";
import { isValidType } from "@ts-expand-type/api/dist/util";

// TODO: add config for e.g. max depth

function init(modules: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
    const ts = modules.typescript

    function create(info: ts.server.PluginCreateInfo) {
      // Set up decorator object
      const proxy: ts.LanguageService = Object.create(null);
      for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
        const x = info.languageService[k]!;
        // @ts-expect-error - JS runtime trickery which is tricky to type tersely
        proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
      }

      proxy.getQuickInfoAtPosition = function (fileName, position) {
        let prior = info.languageService.getQuickInfoAtPosition(fileName, position) as ExpandedQuickInfo

        const program = info.project['program'] as ts.Program|undefined

        if(!program) return prior

        const typeChecker = program.getTypeChecker()
        const sourceFile = program.getSourceFile(fileName)

        if(!sourceFile) return prior

        // const node: ts.Node = ts.getTouchingPropertyName(sourceFile, position);
        const node = getDescendantAtPosition(sourceFile, position)
        if (!node || node === sourceFile) {
            // Avoid giving quickInfo for the sourceFile as a whole.
            return prior
        }

        if(!prior) {
          prior = { } as ExpandedQuickInfo
        }

        if(prior) {
            prior.__displayString = prior.displayParts?.map(({ text }) => text).join("")
            prior.__displayType = getDisplayType(typeChecker, sourceFile, node)
            prior.__displayTree = getDisplayTree(typeChecker, node)

            prior.displayParts = undefined
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

function getDisplayType(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile, node: ts.Node): string|undefined {
    const symbol = typeChecker.getSymbolAtLocation(node)
    if(!symbol) return undefined

    const type = getSymbolType(typeChecker, symbol, node)
    const expandedType = recursivelyExpandType(typeChecker, type)
    
    const typeString = multilineTypeToString(typeChecker, sourceFile, expandedType, undefined, ts_orig.NodeBuilderFlags.MultilineObjectLiterals | ts_orig.NodeBuilderFlags.InTypeAlias)

    return typeString
}

function getTypeNode(typeChecker: TypeChecker, node: Node): ts_orig.TypeNode | undefined {
  const symbol = typeChecker.getSymbolAtLocation(node)
  if(!symbol) return undefined

  const type = getSymbolType(typeChecker, symbol, node)

  return typeChecker.typeToTypeNode(type, node, undefined)
}

export = init