# ts-type-explorer

<p align="center">
<img alt="demo" src="https://user-images.githubusercontent.com/16108792/200933940-b735a2a3-cc9d-40de-a4a9-c10c080eead8.gif" />
</p>

<p align="center" style="padding: 20px 0">
  <a href="https://marketplace.visualstudio.com/items?itemName=mxsdev.typescript-explorer&ssr=false">
    <img src="https://img.shields.io/badge/Install-VSCode%20Marketplace-blue" />
  </a>
</p>

## Installation

You can install from the [VSCode Marketplace][vscode-market-link].

Alternatively, check out the [releases page][releases] to download the `.vsix` file. See [Install from a VSIX][install-from-vsix] for instructions!

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
[vscode-market-link]: https://marketplace.visualstudio.com/items?itemName=mxsdev.typescript-explorer&ssr=false
