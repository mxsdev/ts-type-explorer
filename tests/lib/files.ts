import { fileURLToPath } from "url"
import path from "path"

export const filename = fileURLToPath(import.meta.url)
export const dirname = path.dirname(filename)
