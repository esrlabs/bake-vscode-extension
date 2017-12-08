'use strict';

import * as vscode from 'vscode';
import * as jsonfile from 'jsonfile';

import DefinesImporter from '../importers/DefinesImporter';
import IncludePathsImporter from '../importers/IncludePathsImporter';
import BakeExecutor from '../bake/BakeExecutor';
import CppConfigFile from '../intellisense/CppConfigFile';
import logger from '../util/logger';

let workspaceFolder = null;

const CONFIG_IMPORTERS = [
    DefinesImporter,
    IncludePathsImporter
];

/**
 * Central import command. Invoked automatically during startup when bake
 * workspace was detected.
 * 
 * Can also be invoked by hand, from the VSCode command menu.
 * 
 * @param context 
 */
function importConfig(context: vscode.ExtensionContext) {

    // 
    // Check some prerequisites first
    //
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
        vscode.window.showErrorMessage('Open a workspace first');
        return;
    }

    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    logger.info('Detected workspace folder: ' + workspaceFolder);

    let cppConfigFile = new CppConfigFile(workspaceFolder);
    if (!cppConfigFile.exists()) {
        vscode.window.showErrorMessage('Create a .vscode/c_cpp_properties.json first');
        return;
    }

    // 
    // Ask bake for all includes and defines
    //
    let bakeExecutor = new BakeExecutor(workspaceFolder);
    let config = vscode.workspace.getConfiguration('bake');
    let mainProject = config.get('mainProject');
    bakeExecutor.execute(`-m ${mainProject} --incs-and-defs=json -a black`).then((output) => {
        dispatchBakeOutputToImporter(output);
    }).catch((error) => {
        logger.error(error);
        vscode.window.showErrorMessage('Import Failed! Check console window.');
        return;
    });
}

function dispatchBakeOutputToImporter(bakeOutput) {

    // 
    // Parse bake provided json string first
    //
    let bakeOutputAsJson : object = null;
    try {
        bakeOutputAsJson = JSON.parse(bakeOutput);
    } catch (error) {
        logger.error('Failed to parse bake output: ' + error);
        logger.error(bakeOutput);
        vscode.window.showErrorMessage('Import Failed! Check console window.');
        return;
    }

    //
    // now really dispatch
    //
    let result = true;
    for (let idx in CONFIG_IMPORTERS) {
        let importerType : any = CONFIG_IMPORTERS[idx];
        let importerInstance = new (importerType)(workspaceFolder);
        result = importerInstance.importFrom(bakeOutputAsJson);
        if (!result) {
            break;
        }
    }

    if (result) {
        vscode.window.showInformationMessage('Bake Import Done!');
    } else {
        vscode.window.showErrorMessage('Import Failed! Check console window.');
    }
}

export default importConfig;