import { VscodeE2E, waitChildren } from "../util/vscodeE2E"

const test = VscodeE2E.testCase("recursive.ts")

describe("recursive.ts", () => {
    it(
        "can expand forever",
        test(1, 6, "Recursive", async (root) => {
            expect(await root.getDescription()).toBe("object")

            {
                const children = await waitChildren(root)

                expect(children).toHaveLength(1)
                const child = children[0]

                expect(await child.getLabel()).toBe("a")
                expect(await child.getDescription()).toBe("object")

                let parent = child

                {
                    const children = await waitChildren(parent)

                    expect(children).toHaveLength(1)
                    const child = children[0]

                    expect(await child.getLabel()).toBe("b")
                    expect(await child.getDescription()).toBe(
                        "Recursive (object)"
                    )

                    parent = child

                    {
                        const children = await waitChildren(parent)

                        expect(children).toHaveLength(1)
                        const child = children[0]

                        expect(await child.getLabel()).toBe("a")
                        expect(await child.getDescription()).toBe("object")
                    }
                }
            }
        })
    )
})
