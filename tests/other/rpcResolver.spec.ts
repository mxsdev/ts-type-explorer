import path from 'path'
import { createTsContext } from "../lib/tsUtil"
import { PassThrough } from 'stream'

import { ResolverServiceClient, ResolverServiceServer } from "../../packages/api/dist/service/resolver"
import { SourceFileLocation, getTypeInfoAtRange } from '../../packages/api/dist'
import { expect } from 'chai'
import assert from 'assert'

const fileName = path.join(__dirname, "./intersectionComponent.tsx")

describe('rpc resolver', () => {
  it('sanity check', async () => {
    const ctx = createTsContext(fileName)
    const pos = { line: 4, character: 8 }

    const serverbound = new PassThrough()
    const clientbound = new PassThrough()

    const typeInfoRetriever = async (loc: SourceFileLocation) => getTypeInfoAtRange(ctx, loc, { maxDepth: 6 })

    const client = new ResolverServiceClient(
      serverbound, clientbound,
      typeInfoRetriever,
    )

    const server = new ResolverServiceServer(clientbound, serverbound)

    client.init()
    server.init()

    // expect(await client.sendAndReceive({ type: 'new-tree' })).to.deep.eq({ type: 'new-tree' })

    const info = await typeInfoRetriever({ fileName, range: { start: pos, end: pos }})
    assert(info)

    const localized = await client.sendAndReceive({ type: 'localize', info })

    assert(localized.type === 'localize')

    console.log(localized.data.children)
  })
})

