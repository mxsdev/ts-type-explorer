const fs = require("fs-extra")
const path = require("path")

const { program } = require("commander")

program.option("--clean")

program.parse()
const options = program.opts()

const clean = !!options.clean

async function main() {
    const apiDir = path.resolve(__dirname, "../../api")
    const pluginDir = path.resolve(__dirname, "../../typescript-plugin")

    const nodeModules = path.resolve(__dirname, "../node_modules")
    const dependencyDir = path.join(nodeModules, "@ts-type-explorer")

    const targetApiDir = path.join(dependencyDir, "api")
    const targetPluginDir = path.join(dependencyDir, "typescript-plugin")

    await fs.remove(dependencyDir)

    if (!clean) {
        await fs.mkdir(dependencyDir)

        await fs.copy(apiDir, targetApiDir)
        await fs.copy(pluginDir, targetPluginDir)

        await fs.remove(path.join(targetApiDir, "node_modules"))
        await fs.remove(path.join(targetPluginDir, "node_modules"))
    }
}

main()
