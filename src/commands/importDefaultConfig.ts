'use strict';

import * as vscode from 'vscode';
import * as jsonfile from 'jsonfile';

import IncsAndDefsImporter from '../importers/IncsAndDefsImporter';
import IncsAndDefsExecutor from '../bake/IncsAndDefsExecutor';
import CppConfigFile from '../intellisense/CppConfigFile';
import BakeConfiguration from '../settings/BakeConfiguration';
import logger from '../util/logger';

let workspaceFolder = null;

/**
 * Default import command. Invoked automatically during startup when a
 * bake workspace was detected.
 *
 * Imports the build variant marked as default="true"
 *
 * @param context
 */
function importDefaultConfig(context: vscode.ExtensionContext) {

    //
    // Check some prerequisites first
    //
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
        vscode.window.showErrorMessage('Bake: Open a workspace first');
        return;
    }

    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    logger.info('Detected workspace folder: ' + workspaceFolder);

    let cppConfigFile = new CppConfigFile(workspaceFolder);
    if (!cppConfigFile.exists()) {
        vscode.window.showErrorMessage('Bake: Create an IntelliSense config file (.vscode/c_cpp_properties.json) first. Command "C/Cpp: Edit Configuration..." and save');
        return;
    }

    let bakeConfiguration = new BakeConfiguration();
    let defaultBuildVariant = bakeConfiguration.getDefaultBuildVariant();
    if (!defaultBuildVariant){
        vscode.window.setStatusBarMessage('Bake: define a default bake.buildVariant in .vscode/settings.json to activate auto-import after startup', 10000);
        return;
    }

    logger.info(`Importing default build variant`);

    let incsAndDefsImporter = new IncsAndDefsImporter(workspaceFolder);
    incsAndDefsImporter.import(defaultBuildVariant)
        .then(()=>{
            logger.info(`Done`);
        })
        .catch((error) => {
            logger.error(error);
            vscode.window.showErrorMessage('Bake: Import Failed! Check output window.');
        });

}

export default importDefaultConfig;