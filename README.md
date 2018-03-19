This extension adds support for bake based C++ projects to VS Code.

Bake is a build tool for C++ projects supporting:
- multiple modules (library, executable)
- multiple targets

## Features

- Import include paths into VS Code
- Import C/C++ defines into VS Code
- Create new .h .cpp files based from templates (from file explorer's context menu)
- Search for and execute targets from bake files

## Requirements

- bake installation >= 2.42.1 ([bake installation instructions](https://esrlabs.github.io/bake/install/install_bake.html#how-to-install-bake))
- Linux (more platforms will be supported soon)
- an existing `.vscode/c_cpp_properties.json` file ([how to create](https://code.visualstudio.com/docs/languages/cpp#_intellisense))

## Extension Settings

This extension contributes the following settings:
* `bake.parallelBuildNum`: Number of processes used for parallel bake builds (-j parameter). Global setting that defaults to `8`.
* `bake.unitTestsAdapt`: Adapt for setting used compiler in unit test builds. Global setting that defaults to  `gcc`.
* `bake.runUnitTestsOnBuild`: Boolean whether unit tests shall be run after a successfull unit test build. Global setting that defaults to `true`.
* `bake.defaultPromblemMatcher`: Used problem finder in the output during builds. Default to `$gcc`. Can be overwritten per task in task configuration.


Deprecated (the following settings are now ignored):
* `bake.buildVariants`: mandatory setting to define build variants to retrieve includes/defines from.
* `bake.mainProject`: override the path to the main project (bake's -m flag). Default is `Main`
* `bake.targetConfig`: override the name of the target config
## Known Issues

None

## Release Notes
## 0.6.0
- Register bake targets as build targets with the taskProvider
- Searches entire workspace for targets for setting include paths or build

## 0.5.0
- Introduced search for Project.meta files to configure workspace with

### 0.4.0
- introduced feature to create .h .cpp files based from templates

### 0.3.0
- introduced support for multiple build variants (combinations of project and config)

### 0.2.0

second alpha release, supports:
- import of defines  on linux only

### 0.1.0

initial alpha release, supports:
- import of include paths on linux only
- first try to publish an extension