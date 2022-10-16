function sig1<T extends string>(arg: T, ...arg2: any[]): string { 
    return arg + arg2
}

sig1("asd", 3, 4)