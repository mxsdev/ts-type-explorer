# ts-type-explorer

VSCode Extension & utilities to explore type information in TypeScript projects.

<p align="center">
<img src="https://user-images.githubusercontent.com/16108792/198750577-f9430cc3-ff13-43dc-a027-da8041a38337.gif" />
</p>

## Installation

Check out the [releases page][releases] to download the `.vsix` file. See [Install from a VSIX][install-from-vsix] for instructions!

A release is planned for the [VSCode Marketplace][vscode-marketplace] when the extension is in a more stable state.

## Usage

See [**typescript-explorer-vscode**](packages/typescript-explorer-vscode) for usage information.

## Packages

-   [**typescript-explorer-vscode**](packages/typescript-explorer-vscode) - VSCode Extension
-   [**api**](packages/api) - API for generating type information
-   [**typescript-plugin**](packages/typescript-plugin) - TS Plugin to remotely execute the API on TS Server

## Building

Build the entire project by running `yarn build` in the root directory, and build in watch-mode with `yarn watch`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)!

[releases]: https://github.com/mxsdev/ts-type-explorer/releases
[install-from-vsix]: https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix
[vscode-marketplace]: https://marketplace.visualstudio.com/vscode
