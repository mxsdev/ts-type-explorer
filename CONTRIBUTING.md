# Contributing

Thank you so much for considering contribution!

What follows is a small "knowledge base" which should hopefully make contribution a bit easier to approach!

## Reading

This codebase is entirely built around the following:

1. The [TypeScript Compiler][ts-compiler-api]
2. The [TypeScript Language Service Plugin API][ts-plugin]
3. The [VSCode Extension API][vscode-extension-api]

As such, it is a good idea to have some familiarity with each of these before contributing. It's okay if you don't, but if you get confused, consider referring to the above links and reading a bit :)

## Architecture

The project is currently separated into three main modules, whose dependency graph looks like:

API <-- TSServer Plugin <-- VSCode Plugin

The API layer does most of the "heavy lifting," and is responsible for collecting type information. It also provides utilities like `TypeInfoResolver` which allows the client to lazily resolve this type information.

### API

The API can be divided into two main functions: generating "`TypeInfo`" nodes, and localizing them.

#### TypeInfo

The first function is to take a type/symbol/node and convert it into a `TypeInfo` node, and it is accomplished primarily in `tree.ts`. This is conceptually similar to `typeToTypeNode` from the TypeScript compiler, however in practice it is a little different; see below for more details.

The idea is to generate a tree with children that roughly describes the relationship of types within TypeScript's semantic type system. So, for example, an `object` type has its properties as children, and a `union` type has its constituent types as children, and so on.

In practice, the entire tree is probably too big to send at once, and there is also a problem with recursive types. Both these problems are solved with the notion of a "reference," which must be partially resolved on the client-side. For an example implementation, see the `TypeInfoResolver` class in `resolveTree.ts`.

#### LocalizedTypeInfo

The second job of the API is to take a `TypeInfo` tree, which is fairly low-level, and "localize" it into a `LocalizedTypeInfo` tree, which is a much more readily useful set of information for a client such as an IDE. This is accomplished primarily in `localizedTree.ts`.

Why have this as a separate stage from the previous? Primarily, because it helps separate priorities. The former stage is essentially about creating a 1:1 representation of TypeScript information, which is a complicated process. The latter stage, then, is about taking that information and making decisions about what should be the "name" of the type or what should be considered the "alias" of the type, which is also a fairly complicated process. Trying to do both at once would probably make for some fairly opaque code.

Note that, if you desire to integrate with the API on your own, you are free to localize the `TypeInfo` directly. The localization provided is simply for use in the VSCode extension, though it is flexible enough to (hopefully) be useful in a wide variety of applications!

#### Why not use TypeScript's `TypeNode`?

TypeScript's `TypeNode` pretty much does exactly what we want: it provides a faithful representation of type information in object form. So why not use that instead of `TypeInfo`?

Originally, this was in fact the intent, but if you actually try to make this work, you will find that the TypeNode system flattens things a lot, and will not necessarily include information about, for example, type parameters in every single context. As a consequence, you'll need to include a lot of extra information anyway in the final output, and you'll need to do a lot of deep digging into the declarations and their respective symbols to get the required info. In other words, you effectively do the same amount of work as doing it all yourself in the first place. And so, we might as well just view the process of generating type nodes as our responsibility.

If anyone reading this has ideas about making this all work with type nodes, please open an issue or PR! This would simplify the program's architecture considerably :)

## Gotchas

If you add additional properties to some kind of `TypeInfo` in `types.ts`, it is **absolutely imperative** that you:

1. Include any added child `TypeInfo` nodes in the implementation of `getTypeInfoChildren` (in `tree.ts`)
2. Include any added symbols in the implementation of `getTypeInfoSymbols` (also in `tree.ts`)

These data are used to resolve type circularities by traversing the type info tree, and the aforementioned functions are used to carry out this tree-traversal.

## Testing

This project currently employs two kinds of tests:

1. **Snapshot Tests** for the API in `tests/cases`
2. **E2E/Integration Tests** for VSCode in `packages/typescript-explorer-vscode/src/test`

The VSCode tests are primarily for testing VSCode-specific functionality. Most changes to the codebase, however, are to the API.

Therefore, please strive to add a new test whenever introducing a new feature to the API!

### Snapshot Testing

This project's snapshot testing is inspired by TypeScript's.

Run all baselines with `yarn test`, and provide the `TESTS` environment variable if you'd like to apply a glob pattern to the test names. Running `yarn baseline-accept` will accept all local baselines.

## Versioning/Releasing

This project follows sem-ver with conventional commits. Versioning is done auto-magically with lerna.

### VSCode

The VSCode extension release takes advantage of [pre-releases][vscode-extension-prerelease] for beta testing purposes.

Pre-releases are periodically made and then graduated to release after sufficient testing. This is currently done manually but is intended be automated.

## Further Questions

If you have any questions, feel free to reach out to me (@mxsdev) on [the TypeScript Community discord][ts-discord]. I'm usually pretty available and am around the `#compiler-interals-and-api` channel!

[ts-compiler-api]: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
[ts-plugin]: https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin
[vscode-extension-api]: https://code.visualstudio.com/api
[semver]: https://semver.org/
[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/
[vscode-extension-prerelease]: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions
[ts-discord]: https://discord.com/invite/typescript
