import { PassThrough } from "stream"
import { RPCClient, RPCServer } from "../../packages/api/src/service/protocol"
import { expect } from "chai"
import assert from "assert"

describe("api service protocol", () => {
  it("sanity check", async () => {
    type Serverbound = {
      ping: {
        request: { 
          data: string
        },
        response: { 
          data: string
        }
      },
      pong: {
        request: {
          value: string
        },
        response: {
          value: string
        },
      }
    }

    type Clientbound = { }

    class TestRPCServer extends RPCServer<Clientbound, Serverbound> {
      constructor(
        output: NodeJS.WritableStream,
        input: NodeJS.ReadableStream,
      ) {
        super(output, input)
        
        this.setHandler('ping', async ({ data }) => {
          return {
            data
          }
        })
      }
    }

    class TestRPCClient extends RPCClient<Clientbound, Serverbound> { }

    const serverbound = new PassThrough()
    const clientbound = new PassThrough()

    const client = new TestRPCClient(serverbound, clientbound)
    const server = new TestRPCServer(clientbound, serverbound)

    client.init()
    server.init()

    {
      const result = await client.sendAndReceive("ping", { data: 'pong' })
      expect(result).to.deep.eq({ type: "response", data: { data: 'pong' } } as any)
    }

    {
      const result = await client.sendAndReceive("pong", { value: 'pong' })

      expect(result.type).to.eq('error')
      assert(result.type === 'error')

      expect(result.data.msg).to.include("method unimplemented")
    }
  })
})