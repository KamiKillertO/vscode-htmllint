# vsocde-htmllint

[![Build Status](https://travis-ci.org/KamiKillertO/vscode-htmllint.svg?branch=master)](https://travis-ci.org/KamiKillertO/vscode-htmllint)

A [Visual Studio Code extension](https://code.visualstudio.com/) to lint [HTML](https://www.w3.org/WebPlatform/WG/PubStatus#HTML_specifications) with [htmllint](https://github.com/htmllint/htmllint).

![screenshot](screenshot.png)
_If you find some error message not explicit enough, please create an issue [here](https://github.com/KamiKillertO/vscode-htmllint/issues)_

## Installation

1. Execute `Extensions: Install Extensions` command from [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
2. Type `@sort:installs htmllint` into the search form and install the topmost one.

Read the [extension installation guide](https://code.visualstudio.com/docs/editor/extension-gallery) for more details.

## Usage

This extension automatically validates documents with these [language identifiers](https://code.visualstudio.com/docs/languages/overview#_language-id):

* HTML (`html`)

If you have a valid hmllint configuration file `.htmllintrc` (all options available [here](https://github.com/htmllint/htmllint/wiki/Options)) in the current workspace folder the extension will use it. Otherwise, the default configuration of htmllint will be used.

## Extension settings

#### htmllint.enable

Type: `boolean`  
Default: `true`

Control whether this extension is enabled or not.

<!-- #### stylelint.config

Type: `Object`  
Default: `null`

Set stylelint [`config`](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/node-api.md#config) option. Note that when this option is enabled, stylelint doesn't load configuration files. -->

## License

[APACHE 2.0 License](./LICENSE.txt)
