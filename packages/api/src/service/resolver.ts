/* eslint-disable @typescript-eslint/require-await */
import assert = require("assert")
import { TypeInfoResolver } from "../resolveTree"
import { LocalizedTypeInfo, LocalizedTypeInfoOrError, SourceFileLocation, TypeInfo, TypeInfoRetriever } from "../types"
import { RPCClient, RPCServer } from "./protocol"

type ResolverServiceServerboundMessage = 
  | {
    type: 'new-tree',
  }
  | {
    type: 'localize',
    info: TypeInfo,
  }
  | {
    type: 'localize-children',
    parent: LocalizedTypeInfo,
    typeArguments?: boolean,
  }
  | {
    type: 'retrieve-type-info',
    info: TypeInfo|undefined,
  }
  | {
    type: 'has-localized-type-info',
    info: LocalizedTypeInfo,
  }

type ResolverServiceClientboundMessage =
  | {
    type: 'localize',
    data: LocalizedTypeInfoOrError,
  }
  | {
    type: 'localize-children',
    data: LocalizedTypeInfoOrError[],
  }
  | {
    type: 'retrieve-type-info',
    location: SourceFileLocation,
  }
  | {
    type: 'init'
  }
  | {
    type: 'new-tree',
  }
  | {
    type: 'has-localized-type-info',
    data: boolean,
  }

export class ResolverServiceServer extends RPCServer<ResolverServiceClientboundMessage, ResolverServiceServerboundMessage> {
  typeInfoResolver!: TypeInfoResolver
  
  init(): void {
    super.init()
    this.send({ type: 'init' })

    this.createNewTree()
  }

  createNewTree() {
    this.typeInfoResolver = new TypeInfoResolver(async (location) => {
      const res = await this.sendAndReceive({ type: 'retrieve-type-info', location })
      assert(res.type === 'retrieve-type-info', "Invalid Response")
      return res.info
    })
  }
  
  protected async receive(message: ResolverServiceServerboundMessage): Promise<ResolverServiceClientboundMessage | undefined> {
    switch (message.type) {
      case 'new-tree': {
        this.createNewTree()

        return {
          type: 'new-tree'
        }
      } break

      case 'localize': {
        const { info } = message

        const data = await this.typeInfoResolver.localize(info)

        return {
          type: 'localize',
          data,
        }
      } break

      case 'localize-children': {
        const { parent, typeArguments } = message

        const data = await this.typeInfoResolver.localizeChildren(parent, typeArguments)

        return {
          type: 'localize-children',
          data,
        }
      } break

      case 'has-localized-type-info': {
        const { info } = message

        const data = this.typeInfoResolver.hasLocalizedTypeInfo(info)

        return { 
          type: 'has-localized-type-info',
          data,
        }
      } break
    }
  }
}

export class ResolverServiceClient extends RPCClient<ResolverServiceClientboundMessage, ResolverServiceServerboundMessage> {
  constructor(
    output: NodeJS.WritableStream,
    input: NodeJS.ReadableStream,
    private retriever: TypeInfoRetriever,
  ) { 
    super(output, input)
  }
  
  protected async receive(message: ResolverServiceClientboundMessage): Promise<ResolverServiceServerboundMessage | undefined> {
    switch (message.type) {
      case 'retrieve-type-info': {
        const info = await this.retriever(message.location)
        
        return {
          type: 'retrieve-type-info',
          info,
        }
      }
    }
  }
}