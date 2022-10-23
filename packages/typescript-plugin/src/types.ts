import { TypeInfo } from "@ts-type-explorer/api"
import type * as ts from "typescript"

export type ExpandedQuickInfo = ts.QuickInfo & {
    __displayTree?: TypeInfo
}
