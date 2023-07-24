import { SourceFileLocation, TypeInfo } from "../types"
import { RPCServer } from "./protocol"

type Serverbound = {
  
}

type Clientbound = {
  retrieveTypeInfo: {
    request: {
      location: SourceFileLocation,
    },
    response: TypeInfo | undefined
  }
}

export class RPCExtTreeService extends RPCServer<Clientbound, Serverbound> {

}