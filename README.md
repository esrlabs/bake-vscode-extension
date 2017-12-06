This extension adds support for bake based C++ projects to VS Code.

Bake is a build tool for C++ projects supporting:
- multiple modules (library, executable)
- multiple targets 

## Features

- Import include paths into VS Code

## Requirements

- bake installation >= 2.42.1
- Linux (more platforms will be supported soon)

See [bake installation instructions](https://esrlabs.github.io/bake/install/install_bake.html#how-to-install-bake)
## Extension Settings

This extension contributes the following settings:

* `bake.mainProject`: define the main project (used to query the includes from bake)
 
## Known Issues

None

## Release Notes

### 0.1.0

initial alpha release, supports:
- import of include paths on linux only
- first try to publish an extension