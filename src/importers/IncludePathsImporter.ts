'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import CppConfigFile from '../intellisense/CppConfigFile';
import logger from '../util/logger';

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

/**
 * Make IntelliSense aware of our include paths by updating 
 * the .vscode/c_cpp_properties.json file with the 
 * paths known to bake.
 */
class IncludePathsImporter {

    private _workspaceFolder;

    constructor(workspaceFolder) {
        this._workspaceFolder = workspaceFolder;
    }

    /**
     * @param bakeOutputAsJson output of bake --incs-and-defs=json
     */
    importFrom(bakeOutputAsJson): boolean {
        //
        // Collect and flatten includes 
        //
        let collectedIncludes = null;
        try {
            collectedIncludes = this._collectIncludesFrom(bakeOutputAsJson);
        } catch (error) {
            console.error('Failed to process bake output: ' + error);
            console.error(bakeOutputAsJson);
            return false;
        }

        //
        // Update c_cpp_properties with the new includes
        //
        try {
            this._update_cpp_config(collectedIncludes);
        } catch (error) {
            console.error('Failed to update cppConfig: ' + error);
            console.error(bakeOutputAsJson);
            return false;
        }

        logger.info('Importing includes done');
        return true;
    }

    _collectIncludesFrom(bakeOutput) {
        let collectedIncludes = new Set<string>();
        Object.keys(bakeOutput).forEach((key: string) => {
            let includes = bakeOutput[key].includes;
            let absDir = bakeOutput[key].dir;
            if (!absDir) {
                throw new Error('dir attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            let relativeDir = vscode.workspace.asRelativePath(absDir);

            if (includes) {
                includes.forEach(element => {
                    let include = WORKSPACE_INCLUDE_PREFIX + '/'
                        + path.normalize(path.join(relativeDir, element));
                    collectedIncludes.add(include);
                });
            }
        });
        return collectedIncludes;
    }

    _update_cpp_config(collectedIncludes) {
        let cppConfigFile = new CppConfigFile(this._workspaceFolder);
        let cppConfig = cppConfigFile.read();

        cppConfig.configurations.forEach(element => {
            let includePaths: String[] = element.includePath;
            let updatedIncludePaths = includePaths.filter((include) => !include.startsWith(WORKSPACE_INCLUDE_PREFIX));
            updatedIncludePaths.push(...collectedIncludes);
            element.includePath = updatedIncludePaths;
        });
        cppConfigFile.write(cppConfig);
    }

}

export default IncludePathsImporter;