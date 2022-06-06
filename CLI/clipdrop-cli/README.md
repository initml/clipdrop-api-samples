oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @initml/cli
$ initml COMMAND
running command...
$ initml (--version)
@initml/cli/0.0.0 darwin-arm64 node-v16.15.0
$ initml --help [COMMAND]
USAGE
  $ initml COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`initml hello PERSON`](#initml-hello-person)
* [`initml hello world`](#initml-hello-world)
* [`initml help [COMMAND]`](#initml-help-command)
* [`initml plugins`](#initml-plugins)
* [`initml plugins:install PLUGIN...`](#initml-pluginsinstall-plugin)
* [`initml plugins:inspect PLUGIN...`](#initml-pluginsinspect-plugin)
* [`initml plugins:install PLUGIN...`](#initml-pluginsinstall-plugin-1)
* [`initml plugins:link PLUGIN`](#initml-pluginslink-plugin)
* [`initml plugins:uninstall PLUGIN...`](#initml-pluginsuninstall-plugin)
* [`initml plugins:uninstall PLUGIN...`](#initml-pluginsuninstall-plugin-1)
* [`initml plugins:uninstall PLUGIN...`](#initml-pluginsuninstall-plugin-2)
* [`initml plugins update`](#initml-plugins-update)

## `initml hello PERSON`

Say hello

```
USAGE
  $ initml hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Whom is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/initml/clipdrop-api-samples/blob/v0.0.0/dist/commands/hello/index.ts)_

## `initml hello world`

Say hello world

```
USAGE
  $ initml hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ oex hello world
  hello world! (./src/commands/hello/world.ts)
```

## `initml help [COMMAND]`

Display help for initml.

```
USAGE
  $ initml help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for initml.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `initml plugins`

List installed plugins.

```
USAGE
  $ initml plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ initml plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.11/src/commands/plugins/index.ts)_

## `initml plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ initml plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ initml plugins add

EXAMPLES
  $ initml plugins:install myplugin 

  $ initml plugins:install https://github.com/someuser/someplugin

  $ initml plugins:install someuser/someplugin
```

## `initml plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ initml plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ initml plugins:inspect myplugin
```

## `initml plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ initml plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ initml plugins add

EXAMPLES
  $ initml plugins:install myplugin 

  $ initml plugins:install https://github.com/someuser/someplugin

  $ initml plugins:install someuser/someplugin
```

## `initml plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ initml plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ initml plugins:link myplugin
```

## `initml plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ initml plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ initml plugins unlink
  $ initml plugins remove
```

## `initml plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ initml plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ initml plugins unlink
  $ initml plugins remove
```

## `initml plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ initml plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ initml plugins unlink
  $ initml plugins remove
```

## `initml plugins update`

Update installed plugins.

```
USAGE
  $ initml plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
