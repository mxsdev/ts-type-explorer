import { LocalizedTypeInfo } from "@ts-type-explorer/api"
import { TypeTreeItem } from "../../packages/typescript-explorer-vscode/src/view/typeTreeView"

const mapped = ([] as LocalizedTypeInfo[]).map(
    (x) => x as unknown as TypeTreeItem
)
