interface TestInterface {
    getThing(): string
}

class TestClass implements TestInterface {
    constructor(param: string) { }

    getThing() {
        return "as"
    }
}

const _a = new TestClass("param")