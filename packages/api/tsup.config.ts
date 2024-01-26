import * as fs from "node:fs"
import * as path from "node:path"
import { defineConfig } from "tsup"

//读取src下的文件列表
const files: string[] = []

const readFilesRecursive = (dir: string) => {
    for (const file of fs.readdirSync(dir)) {
        if (file === "tsconfig.json") {
            continue
        }
        const filepath = path.join(dir, file)
        const stat = fs.statSync(filepath)
        if (stat.isDirectory()) {
            readFilesRecursive(filepath)
        } else {
            if (filepath.endsWith(".ts")) {
                files.push(filepath)
            }
        }
    }
}

readFilesRecursive("src")

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ["cjs", "esm"],
    external: [
        // 'assert',
        "typescript",
    ],
})
