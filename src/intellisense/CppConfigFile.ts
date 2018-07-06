
import * as path from 'path';
import * as fs from 'fs';
import * as jsonfile from 'jsonfile';
import logger from '../util/logger';

const CPP_CONFIG_FILENAME = 'c_cpp_properties.json';
const WORKSPACE_SETTINGS_FOLDER = '.vscode';
const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

/**
 * Offers access to .vscode/c_cpp_properties.json
 */
class CppConfigFile {

    private _cppConfigFile;

    constructor(workspaceFolder) {
        this._cppConfigFile = path.join(workspaceFolder
            , WORKSPACE_SETTINGS_FOLDER
            , CPP_CONFIG_FILENAME);
    }

    exists(): boolean {
        return fs.existsSync(this._cppConfigFile);
    }

    cleanImportsAndDefines(){
        let cppConfig = this.read();

        cppConfig.configurations.forEach(element => {
            try {
                //keep the system includes
                element.includePath = element.includePath.filter((include) => !include.startsWith(WORKSPACE_INCLUDE_PREFIX))
                element.defines = []                
            } catch (error) {
                logger.error(error)
            }
        });

        this.write(cppConfig);
    }

    addImportsAndDefines(collectedIncludes: string[], collectedDefines: string[]){
        let cppConfig = this.read();

        cppConfig.configurations.forEach(element => {
            try {
    /* troels
                //set includes
                let includePaths: string[] = element.includePath
                let existingIncludePaths: string[] = includePaths
                // Make sure workspace paths all have same format
                collectedIncludes = collectedIncludes.map(p => p.replace(/\\/g, "/"))
                let newIncludePaths : Set<string> = new Set(collectedIncludes); //assure each entry is unique
                existingIncludePaths.forEach( e => newIncludePaths.add(e) )
                element.includePath = Array.from(newIncludePaths)
    */
    
                //Set Includes
                let newIncludePaths : Set<string> = new Set<string>(element.includePath)
                // Make sure workspace paths all have same format
                collectedIncludes = collectedIncludes.map(p => p.replace(/\\/g, "/"))
                collectedIncludes.forEach( e => newIncludePaths.add(e) )
                element.includePath = Array.from(newIncludePaths)
    
                //Set Defines
                let newDefines : Set<string> = new Set([...element.defines])
                collectedDefines.forEach(element => {
                    newDefines.add(element);
                });
                element.defines = Array.from(newDefines)
                
            } catch (error) {
                logger.error(error)                
            }
        });

        this.write(cppConfig);
    }

    private read() {
        return jsonfile.readFileSync(this._cppConfigFile);
    }

    private write(config: object) {
        jsonfile.writeFileSync(this._cppConfigFile
            , config
            , { spaces: 2, EOL: '\n' }
        );
    }


}

export default CppConfigFile;