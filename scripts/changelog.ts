import { readFileSync } from "fs"
import { program } from "commander"

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const lernaJson =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("../lerna.json") as typeof import("../lerna.json")

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const defaultVersion: string = lernaJson.version

program.option("-v, --version <text>", undefined, defaultVersion)
program.option("-f, --file <filename>", "Changelog file", "CHANGELOG.md")
program.parse()

const options = program.opts<{
    version: string
    file: string
}>()

const semVerRegex =
    "([0-9]+)\\.([0-9]+)\\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?(?:\\+[0-9A-Za-z-]+)?"

const changelog = readFileSync(options.file).toString()
const changelogMd = getChangelogMd(options.version, changelog)

if (changelogMd === undefined) {
    throw new Error(`Version '${options.version}' found!`)
}

console.log(changelogMd)

function getChangelogMd(
    version: string,
    changelog: string
): string | undefined {
    let found = false
    const res: string[] = []

    for (const line of changelog.split("\n")) {
        const lineDepth = getLineDepth(line)
        const lineContent = line.slice(lineDepth).trimStart()

        if (found) {
            if (!isVersionLine(lineContent, semVerRegex, false)) {
                if (lineDepth === 0) {
                    res.push(line)
                } else {
                    res.push(
                        "#".repeat(Math.max(lineDepth - 1, 1)) +
                            " " +
                            lineContent
                    )
                }
            } else {
                break
            }
        } else if (lineDepth >= 1) {
            if (isVersionLine(lineContent, version)) {
                found = true
            }
        }
    }

    return res.length > 0 ? res.join("\n").trim() : undefined
}

function isVersionLine(line: string, version: string, escape = true) {
    if (escape) {
        version = escapeRegExp(version)
    }

    return [
        new RegExp(`^${version} \\((?:.+)\\)$`),
        new RegExp(`^\\[${version}\\]\\((?:.+)\\)$`),
    ].some((x) => x.test(line))
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

function getLineDepth(line: string, compare = "#") {
    let depth = 0

    for (const char of line) {
        if (char === compare) {
            depth++
        }
    }

    return depth
}
