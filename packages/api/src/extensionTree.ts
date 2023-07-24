/* eslint-disable @typescript-eslint/require-await */

import {
    LocalizedTypeInfo,
    LocalizedTypeInfoOrError,
    TypeInfoResolver,
} from "./"
import type * as Proto from "typescript/lib/protocol"
import assert = require("assert")
import { URI as Uri } from "vscode-uri"
import { markdownDocumentation } from "./extensionMarkdown"
import { getMetaWithTypeArguments, getMeta } from "./extensionTreeMeta"
import { ExtensionConfig, ExtensionTreeChildrenUpdateInfo, ExtensionTreeItemMeta, ExtensionTreeNode, ExtensionTreeNodeConstructor, ExtensionTreeProvider, SourceFileLocation, TypeId, TypeInfo, TypeInfoRetriever } from "./types"

export class ExtensionTreeProviderImpl<T extends ExtensionTreeNode> implements ExtensionTreeProvider<T> {
    constructor(
      protected createNode: ExtensionTreeNodeConstructor<T>,
      protected getTypeTree: () => TypeInfo | undefined,
      protected typeInfoRetriever: TypeInfoRetriever,
      protected getQuickInfoAtLocation: (loc: SourceFileLocation) => Promise<Proto.QuickInfoResponseBody | undefined>,
      protected onError: (error: Error, message: string) => void,
      protected includeIds = false,
    ) { }

    private flatTree = new Map<TypeId, T>()

    private typeInfoResolver: TypeInfoResolver | undefined

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected _fireOnDidGetChildren(data: ExtensionTreeChildrenUpdateInfo<T>): void { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected _fireOnDidChangeTreeData(data: T | T[] | undefined | null | void): void { }

    refresh(): void {
        this.typeInfoResolver = undefined
        this.flatTree = new Map<TypeId, T>()
        this._fireOnDidChangeTreeData()
    }

    async resolveNode(element: T) {
        if (element.typeInfo.error) {
            return element
        }

        if (element.typeInfo.kind === "max_depth") {
            element.updateMeta({ tooltip: "max depth exceeded" })
        } else {
            if (element.typeInfo.locations) {
                for (const location of element.typeInfo.locations) {
                    const { documentation, tags } =
                        (await this.getQuickInfoAtLocation(location)) ?? {}

                    if (documentation && documentation.length > 0) {
                        element.updateMeta(
                            {
                                tooltip: markdownDocumentation(
                                    documentation,
                                    tags ?? [],
                                    Uri.file(location.fileName)
                                )
                            }
                        )
                        break
                    }
                }
            }

            if (
                element.typeInfo.typeArguments &&
                element.typeInfo.typeArguments.length > 0
            ) {
                const typeArguments = await this.localizeTypeInfoTypeArguments(
                    element.typeInfo
                )

                const newMeta = getMetaWithTypeArguments(
                    element.typeInfo,
                    typeArguments
                )

                if (newMeta) {
                    if (newMeta.description) {
                        element.updateMeta({ description: newMeta.description })
                    }

                    if (newMeta.label) {
                        element.updateMeta({ label: newMeta.label })
                    }
                }
            }
        }

        return element
    }

    async generateTree(
        element?: T,
        extensionConfig?: ExtensionConfig,
    ): Promise<T[]> {
        const children = await this.generateTreeWorker(element, extensionConfig).catch((e) => {
            this.onError(e as Error, "Error getting children")
            return []
        })

        this._fireOnDidGetChildren({ parent: element, children })

        return children
    }

    private async localizeTypeInfoChildren(
        typeInfo: LocalizedTypeInfo,
        typeArguments?: boolean
    ) {
        if (!this.typeInfoResolver?.hasLocalizedTypeInfo(typeInfo)) {
            return []
        }

        return this.typeInfoResolver.localizeChildren(typeInfo, typeArguments)
    }

    private async localizeTypeInfoTypeArguments(typeInfo: LocalizedTypeInfo) {
        return this.localizeTypeInfoChildren(typeInfo, true)
    }

    private async generateTreeWorker(
        element?: T,
        extensionConfig?: ExtensionConfig,
    ): Promise<T[]> {
        const { showTypeParameterInfo, showBaseClassInfo } = extensionConfig ?? { }
        
        if (!element) {
            const typeInfo = this.getTypeTree()
            if (!typeInfo) {
                return []
            }

            this.typeInfoResolver = new TypeInfoResolver(this.typeInfoRetriever)

            if (this.includeIds) {
                this.typeInfoResolver.withIds()
            }

            const localizedTypeInfo = await this.typeInfoResolver.localize(
                typeInfo
            )

            return [
                this.createTypeNode(localizedTypeInfo, /* root */ undefined),
            ]
        } else {
            const localizedChildren = await this.localizeTypeInfoChildren(
                element.typeInfo
            )

            return localizedChildren
                .map((info) => this.createTypeNode(info, element))
                .filter(
                    ({ typeInfo: { purpose } }) =>
                        showTypeParameterInfo ||
                        !(
                            purpose === "type_argument_list" ||
                            purpose === "type_parameter_list"
                        )
                )
                .filter(
                    ({ typeInfo: { purpose } }) =>
                        showBaseClassInfo ||
                        !(
                            purpose === "class_base_type" ||
                            purpose === "class_implementations" ||
                            purpose === "object_class"
                        )
                )
        }
    }

    createTypeNode(
        typeInfo: LocalizedTypeInfoOrError,
        parent: T | undefined
    ) {
        const node = this.createNode(typeInfo, parent)
        if (typeInfo._id) { this.flatTree.set(typeInfo._id, node) }

        return node
    }

    getNodeById(id: TypeId): T | undefined {
        return this.flatTree.get(id)
    }
}

export class ExtensionTreeNodeImpl<Self extends ExtensionTreeNode> implements ExtensionTreeNode {
    readonly depth: number
    meta: ExtensionTreeItemMeta
    
    constructor(
        public typeInfo: LocalizedTypeInfoOrError,
        // private provider: ExtensionTreeProvider<Self>,
        protected parent?: Self,
    ) {
        const depth = (parent?.depth ?? 0) + 1

        this.meta = getMeta(typeInfo, depth)
        this.depth = depth
    }

    updateMeta(meta: Partial<ExtensionTreeItemMeta>): void {
        this.meta = {
            ...this.meta,
            ...meta,
        }
    }

    private definitionIndex = 0

    getNextDefinition() {
        const locations = !this.typeInfo.error
            ? this.typeInfo.locations
            : this.typeInfo.error.typeInfo?.symbolMeta?.declarations?.map(
                  ({ location }) => location
              )

        assert(locations && locations.length > 0, "Type has no locations!")

        const location = locations[this.definitionIndex]
        this.definitionIndex = (this.definitionIndex + 1) % locations.length
                
        return location
    }
}

