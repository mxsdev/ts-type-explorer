import {
    clearConfigUpdates,
    clearListeners,
    focusTreeView,
    initListeners,
} from "../testLibrary"

import * as extension from "../../extension"

import { before, beforeEach, afterEach } from "mocha"

before(async () => {
    await focusTreeView()

    // wait for extension to initialize
    await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
            if (extension.stateManager.initialized) {
                clearInterval(timer)
                resolve()
            }
        }, 200)
    })

    initListeners()
})

beforeEach(async () => {
    await focusTreeView()
    await extension.stateManager.setSelectionLock(false)
})

afterEach(async () => {
    clearListeners()
    await clearConfigUpdates()
})
