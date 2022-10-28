# typescript-plugin

TypeScript Server Plugin intended for use in [typescript-explorer-vscode](../typescript-explorer-vscode).

It functions by proxying the `getQuickInfoAtPosition` endpoint, adding a `__displayTree` property on the object, which is the `TypeInfo` tree of the nearest node.
