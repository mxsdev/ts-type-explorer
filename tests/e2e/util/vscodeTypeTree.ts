import {
    SideBarView,
    NewScmView,
    ScmView,
    DebugView,
    ActivityBar,
    CustomTreeSection,
} from "wdio-vscode-service"

type SBView = SideBarView<any> | NewScmView | ScmView | DebugView

export class VscodeTypeTreeView {
    private constructor(
        private browser: WebdriverIO.Browser,
        private view: SBView
    ) {}

    async withLock(cb: () => Promise<void>) {
        await (await this.lockButton()).click()
        await cb()
        await (await this.lockButton()).click()
    }

    private async lockButton() {
        const titlePart = this.view.getTitlePart()

        return await titlePart.action$$
            .then((a) =>
                Promise.all(
                    a.map(async (el) => {
                        const classes = await el.getAttribute("class")

                        return classes.includes("codicon-lock") ||
                            classes.includes("codicon-unlock")
                            ? el
                            : undefined
                    })
                )
            )
            .then((list) => list.find((x) => x)!)
    }

    async waitRoot(label?: string) {
        this.browser.waitUntil(async () => {
            if (label === undefined) return true

            const root = await this.getRoot()
            return (await root.getLabel()) === label
        })

        return await this.getRoot()
    }

    async getRoot() {
        const section = await this.getTreeSection()

        await this.browser.waitUntil(
            async () => (await section.getVisibleItems()).length > 0
        )

        const visibleItems = await section.getVisibleItems()

        expect(visibleItems.length).toBeGreaterThanOrEqual(1)

        return visibleItems[0]
    }

    static async create(browser: WebdriverIO.Browser) {
        const workbench = await browser.getWorkbench()

        const viewController = await this.getViewController(
            workbench.getActivityBar()
        )

        const sidebarView = await viewController.openView()

        return new VscodeTypeTreeView(browser, sidebarView)
    }

    private static async getViewController(activityBar: ActivityBar) {
        await browser.waitUntil(async () => !!(await _getViewController()))

        return (await _getViewController())!

        async function _getViewController() {
            const controls = await activityBar.getViewControls()

            return (
                await Promise.all(
                    controls.map(async (c) => [c, await c.getTitle()] as const)
                )
            ).find(([, title]) => title === "TypeScript Explorer")?.[0]
        }
    }

    private async getTreeSection() {
        const content = this.view.getContent()
        await browser.waitUntil(
            async () => (await content.getSections()).length > 0
        )

        const typeTree = (await content.getSections())[0] as CustomTreeSection

        return typeTree
    }
}
