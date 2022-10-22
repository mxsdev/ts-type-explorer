/* eslint-disable @typescript-eslint/no-misused-promises */

import { clearLocalBaselines, generateBaselineTests } from "./baselines"

before(async () => {
    await clearLocalBaselines()
})

describe("baselines", generateBaselineTests)
