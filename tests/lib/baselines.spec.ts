import { clearLocalBaselines, generateBaselineTests, getTestCases } from "./baselines"

before(async () => {
    await clearLocalBaselines()
})

describe("baselines", generateBaselineTests)