# Changelog
All notable changes to the "bake" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
 - "Use RText Server" settings option (default: enabled). When it is enabled the `bake-rtext-service` is used to get the diagnostic information (can be found in Problems tab). Bake version 2.56.0 or higher is required.

## [0.8.0] - 2019-12-23
### Added
 - Syntax highlighting for Bake 2.54.x.
 - Format document support.
 - Provide hover contents for keywords.
 - Show code completion proposals.

### Fixed
 - Tasks configuration.

## [0.7.0]
 - Re-introduced possibility to pre-define build variants in settings
 - Bake _adapts_ (--adapt) are now supported for pre-defined variants
 - Pre-defined build variant marked as "default" is automatically imported after each VS Code startup
 - Build variants defined in settings and variants found dynamically (through searching Project.meta files) can now co-exist
 - Bake tasks are derived from last selected build variant
 - More logging and better error messages
 - Cleaned up code base

## [0.6.0]
- Register bake targets as build targets with the taskProvider
- Searches entire workspace for targets for setting include paths or build

## [0.5.0]
- Introduced search for Project.meta files to configure workspace with

## [0.4.0]
- introduced feature to create .h .cpp files based from templates

## [0.3.0]
- introduced support for multiple build variants (combinations of project and config)

## [0.2.0]
second alpha release, supports:
- import of defines  on linux only

## [0.1.0]
initial alpha release, supports:
- import of include paths on linux only
- first try to publish an extension