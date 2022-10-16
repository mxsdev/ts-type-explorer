class TestBaseClass { }

class TestClass<T> extends TestBaseClass {
    constructor(thing: boolean, param: string|number) { 
        super()
    }

    param: string = "a"
    param2: string = "b"

    getThing(param: T) {
        return "as"
    }
}

const _a = new TestClass<string>(false, 4)