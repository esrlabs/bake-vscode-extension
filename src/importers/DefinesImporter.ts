'use strict';

import * as vscode from 'vscode';
import CppConfigFile from '../intellisense/CppConfigFile';

/**
 * Make IntelliSense aware of our DEFINES by updating 
 * the .vscode/c_cpp_properties.json file with the 
 * defines known to bake.
 */
class DefinesImporter {

    private _workspaceFolder;

    constructor(workspaceFolder, cppConfigFile) {
        this._workspaceFolder = workspaceFolder;
    }

    importFrom(bakeOutputAsJson): boolean {
        //
        // Collect and flatten defines 
        //
        let collectedDefines = null;
        try {
            collectedDefines = this._collectDefinesFrom(bakeOutputAsJson);
        } catch (error) {
            console.error('Failed to process bake output: ' + error);
            console.error(bakeOutputAsJson);
            return false;
        }

        //
        // Update c_cpp_properties with the new defines
        //
        try {
            this._update_cpp_config(collectedDefines);
        } catch (error) {
            console.error('Failed to update cpp config file: ' + error);
            console.error(bakeOutputAsJson);
            return false;
        }

        console.log('Importing defines done');
        return true;        
    }

    _collectDefinesFrom(bakeOutput) {
        let collectedDefines = new Set<string>();
        Object.keys(bakeOutput).forEach((key: string) => {
            let cDefines = bakeOutput[key].c_defines;
            if (!cDefines) {
                throw new Error('c_defines attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            let cppDefines = bakeOutput[key].cpp_defines;
            if (!cppDefines) {
                throw new Error('cpp_defines attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            cDefines.forEach(element => {
                collectedDefines.add(element);
            });
            cppDefines.forEach(element => {
                collectedDefines.add(element);
            });
        });
        return collectedDefines;
    }

    _update_cpp_config(collectedDefines) {
        let cppConfigFile = new CppConfigFile(this._workspaceFolder);
        let cppConfig = cppConfigFile.read();

        cppConfig.configurations.forEach(element => {
            let newDefines = new Set(element.defines);
            collectedDefines.forEach(element => {
                newDefines.add(element);
            });
            element.defines = [...newDefines];
        });
        cppConfigFile.write(cppConfig);
    }

}

export default DefinesImporter;