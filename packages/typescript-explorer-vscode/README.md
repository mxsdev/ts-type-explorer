# TypeScript Explorer

<p align="center">
<img alt="demo" src="https://user-images.githubusercontent.com/16108792/200933940-b735a2a3-cc9d-40de-a4a9-c10c080eead8.gif" />
</p>

**_Disclaimer_: This project is currently IN BETA, and is therefore _subject to bugs and feature incompleteness!!_ Please [open an issue][issues] if you encounter a bug or have any other suggestions!**

VSCode Extension providing full type information in TypeScript projects. Supports:

-   Functions
-   Primitive Types
-   Literal Types
-   Generics (Type Parameters)
-   Classes, Interfaces, Enums
-   Namespaces, Modules
-   Conditional Types, Infer

## Usage

Typescript Explorer provides a new [view container][vscode-view-container], which presents hierarchical type information for type definitions, variables, and functions in TypeScript Projects:

<p align="center">
<img width="800" alt="type tree view" src="https://user-images.githubusercontent.com/16108792/200496679-3836329e-04e7-4dc6-b8f8-8b83208f65bd.png">
</p>

By default, this will update type information on every click/selection in the text editor. This behavior can be changed either by [locking the selection](#lock-selection), or by disabling the ["Type Tree > Selection"](#selection) configuration option.

There is also a command, "Select Symbol in Type Tree," which selects the type at the current cursor position, and is available in the editor's right-click menu:

<p align="center">
<img width="549" alt="select symbol command" src="https://user-images.githubusercontent.com/16108792/200499074-42cbbac6-bf80-4c5c-9abd-57236a296583.png">
</p>

### Go To Definition

<p align="center">
<img width="800" alt="go to definition" src="https://user-images.githubusercontent.com/16108792/200497918-fd3e0317-a061-4d50-9842-b3d30d53a893.png">
</p>

Finds the definition of the selected menu item. This will first go to the associated symbol; if there is no symbol, this will find the associated type definition.

If there are multiple definitions (such as in [declaration merging][ts-declaration-merging]), they will cycle through.

### Hover for JSDoc

<p align="center">
<img width="500" alt="hover for jsdoc" src="https://user-images.githubusercontent.com/16108792/200917669-96a38d30-3ce4-4763-a7a1-386434870037.png">
</p>

Hover over an item in the menu to retrieve JSDoc.

### Lock Selection

<p align="center">
<img width="800" alt="lock selection" src="https://user-images.githubusercontent.com/16108792/200501969-0228257b-c683-416a-bcbd-0f119f6f0fdc.png">
</p>

Prevents the current shown type information from changing on editor/cursor selection.

### Configuration

#### Selection

<p align="center">
<img width="480" alt="selection config" src="https://user-images.githubusercontent.com/16108792/200499704-50be2121-168c-4ede-943f-25f3b88ef47b.png">
</p>

Prevents type information from changing on click in the editor.

#### Base Class / Type Parameters

<p align="center">
<img width="533" alt="base class and type parameter config" src="https://user-images.githubusercontent.com/16108792/200502457-2a5fb329-fa2f-4761-af82-faa64f4b421d.png">
</p>

Enable/disable base class or ambient type parameter information.

#### Icons

<p align="center">
<img width="540" alt="icon config" src="https://user-images.githubusercontent.com/16108792/200502636-177ca983-3239-4ab8-b4fb-5f0fca9080df.png">
</p>

Toggle icons and icon colors in the tree view.

#### Readonly

<p align="center">
<img width="428" alt="readonly config" src="https://user-images.githubusercontent.com/16108792/200504223-f03f0ef0-1742-410d-8e71-d2054dfc77d7.png">
</p>

Adds "readonly" to readonly properties and arrays:

<p align="center">
<img width="921" alt="readonly demonstration" src="https://user-images.githubusercontent.com/16108792/200503271-e9d9d963-dd01-4106-9d5d-f39e2f1df844.png">
</p>

[vscode-view-container]: https://code.visualstudio.com/api/ux-guidelines/views#view-containers
[ts-declaration-merging]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
[issues]: https://github.com/mxsdev/ts-type-explorer/issues
