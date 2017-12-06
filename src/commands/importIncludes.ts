'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import BakeExecutor from '../bake/BakeExecutor';
import * as path from 'path';
import * as fs from 'fs';
import * as jsonfile from 'jsonfile';

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

const CPP_CONFIG_FILENAME = 'c_cpp_properties.json';
const WORKSPACE_SETTINGS_FOLDER = '.vscode';

function importIncludes(context: vscode.ExtensionContext) {

    // 
    // Check some prerequisites first
    //
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
        vscode.window.showErrorMessage('Open a workspace first');
        return;
    }

    let workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    console.log('Detected workspace folder: ' + workspaceFolder);

    let cppConfigFile = path.join(workspaceFolder, WORKSPACE_SETTINGS_FOLDER, CPP_CONFIG_FILENAME);
    if (!fs.existsSync(cppConfigFile)) {
        vscode.window.showErrorMessage('Create a .vscode/c_cpp_properties.json first');
        return;
    }

    // 
    // Step 1: ask bake for all includes
    //
    let bakeExecutor = new BakeExecutor(workspaceFolder);
    bakeExecutor.execute('-m Main --incs-and-defs=json -a black').then((output) => {
        _importIncludes(output, cppConfigFile);
    }).catch((error) => {
        console.error(error);
        vscode.window.showErrorMessage('Import Failed! Check console window.');
        return;
    });
}

function _importIncludes(bakeOutput, cppConfigFile)
{
    // 
    // Step 2: Parse bake provided list 
    //
    let bakeOutputAsJson = null;
    try {
        bakeOutputAsJson = JSON.parse(bakeOutput);
    } catch (error) {
        console.error('Failed to parse bake output: ' + error);
        console.error(bakeOutput);
        vscode.window.showErrorMessage('Import Failed! Check console window.');
        return;
    }

    //
    // Step 3: Collect and flatten includes 
    //
    let collectedIncludes = null;
    try{
        collectedIncludes = _collectIncludesFrom(bakeOutputAsJson);        
    } catch (error){
        console.error('Failed to process bake output: ' + error);
        console.error(bakeOutputAsJson);
        vscode.window.showErrorMessage('Import Failed! bake up-to-date? Check console window.');
        return;
    }

    //
    // Step 4: Update c_cpp_properties with the new includes
    //
    try{
        _update_cpp_config(cppConfigFile, collectedIncludes);        
    } catch(error){
        console.error('Failed to update ' + cppConfigFile + ': ' + error );
        console.error(bakeOutputAsJson);
        vscode.window.showErrorMessage('Import Failed! Check console window.');
        return;
    }

    // Display a message box to the user
    vscode.window.showInformationMessage('Import Done!');
}

function _collectIncludesFrom(bakeOutput) {
    let collectedIncludes = new Set<string>();
    Object.keys(bakeOutput).forEach((key: string) => {
        let includes = bakeOutput[key].includes;
        let absDir = bakeOutput[key].dir;
        if (!absDir){
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

function _update_cpp_config(cppConfigFile: string, collectedIncludes) {
    let cppConfig = jsonfile.readFileSync(cppConfigFile);
    cppConfig.configurations.forEach(element => {
        let includePaths : String[] = element.includePath;
        let updatedIncludePaths = includePaths.filter((include)=>!include.startsWith(WORKSPACE_INCLUDE_PREFIX));
        updatedIncludePaths.push(...collectedIncludes);
        element.includePath = updatedIncludePaths;
    });
    jsonfile.writeFileSync(cppConfigFile, cppConfig, {spaces: 2, EOL: '\n'});
}

export default importIncludes;