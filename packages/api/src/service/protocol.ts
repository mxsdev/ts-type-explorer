/* eslint-disable @typescript-eslint/require-await */
import { Interface } from "readline"
import { createInterface } from "readline"

type MessageId = number

type RPCMessageType<Request, Response> = {
  request: Request
  response: Response
}

type RPCMessageTable = Record<string, RPCMessageType<unknown, unknown>>

type ResponseOrError<Response> = 
  |{
    type: 'response'
    data: Response
  }
  |{
    type: 'error'
    data: {
      msg: string
      stack?: string
    }
  }

type RPCMessage<Request, Response, Method> = {
  mid: MessageId,
  key: Method,
  payload: 
    |{
      type: 'request'
      data: Request
    }
    |ResponseOrError<Response>
}

type RPCHandler<T extends RPCMessageTable, K extends keyof T> = (msg: T[K]['request']) => Promise<T[K]['response']>

abstract class RPCInterface<Outgoing extends RPCMessageTable, Incoming extends RPCMessageTable> {
  private messageCache = new Map<MessageId, (response: ResponseOrError<unknown>) => void>
  
  private rl: Interface
  private initialized = false
  
  constructor(
    private output: NodeJS.WritableStream,
    input: NodeJS.ReadableStream,
  ) {
    this.rl = createInterface({
      input, output
    })
  }

  protected abstract mid(): MessageId

  private handlers: Record<string, RPCHandler<Incoming, keyof Incoming>> = { }

  protected setHandler<M extends keyof Incoming>(key: M, handler: RPCHandler<Incoming, M>) {
    this.handlers[key as string] = handler as unknown as RPCHandler<Incoming, keyof Incoming>
  }

  async sendAndReceive<M extends keyof Outgoing>(key: M, payload: Outgoing[M]['request']): Promise<ResponseOrError<Outgoing[M]['response']>> {
    const msg: RPCMessage<Outgoing[M]['request'], Outgoing[M]['response'], M> = {
      mid: this.mid(),
      key,
      payload: {
        type: 'request',
        data: payload,
      }
    }
    
    return await new Promise(r => {
      this.messageCache.set(msg.mid, r)
      this._send(msg)
    })
  }
  
  init() {
    if (this.initialized) return
    this.initialized = true

    this.rl.addListener('line', (l) => {
      let res: RPCMessage<unknown, unknown, string>
      
      try {
        res = JSON.parse(l) as RPCMessage<unknown, unknown, string>
      } catch(e) {
        // TODO: log this somewhere...
        return
      }
      
      this._receive(res)
    })
  }
  
  protected async _receive(message: RPCMessage<unknown, unknown, string>) {
    const cb = this.messageCache.get(message.mid)
    if (cb && message.payload.type !== 'request') {
      cb(message.payload)
      this.messageCache.delete(message.mid)

      return
    }

    if (message.payload.type !== 'request') {
      return
    }

    let payload: Incoming[string]['response']|undefined
    
    try {
      const handler = this.handlers[message.key]
      if (!handler) {
        throw new Error('method unimplemented')
      }

      payload = await handler(message.payload.data)
    } catch(e: unknown) {
      this._error(
        message.mid,
        message.key,
        e instanceof Error ? e : new Error(`Unknown error e: ${new String(e).toString()}`),
      )

      return
    }

    this._send({ mid: message.mid, key: message.key, payload: { type: 'response', data: payload } })
  }

  protected _send(msg: RPCMessage<unknown, unknown, unknown>) {
    this.output.write(JSON.stringify(msg) + "\n")
  }

  private _error(mid: MessageId, key: string, err: Error) {
    const stack = err.stack
    const msg = err.message

    this._send({ mid, key, payload: { type: 'error', data: { msg, stack }} })
  }
}

export abstract class RPCServer<Clientbound extends RPCMessageTable, Serverbound extends RPCMessageTable> extends RPCInterface<Clientbound, Serverbound> {
  private numMessages: MessageId = -1

  protected mid(): MessageId {
    return this.numMessages--
  }
}

export abstract class RPCClient<Clientbound extends RPCMessageTable, Serverbound extends RPCMessageTable> extends RPCInterface<Serverbound, Clientbound> {
  private numMessages: MessageId = 0

  protected mid(): MessageId {
    return this.numMessages++
  }
}