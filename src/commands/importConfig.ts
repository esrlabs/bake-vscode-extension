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
 * Import command to be called from VSCode command menu. 
 * 
 * @param context 
 */
function importConfig(context: vscode.ExtensionContext) {

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
    let buildVariants = bakeConfiguration.getBuildVariants();
    if (!buildVariants){
        vscode.window.showWarningMessage('Bake: define bake.buildVariants at .vscode/settings.json first');
        return;
    }

    let buildVariantsAsNames = Object.keys(buildVariants);

    //Let user select which config to import
    vscode.window.showQuickPick(buildVariantsAsNames).then((selected)=>{
        if (!selected){
            return;
        }
        doImportConfig(selected, bakeConfiguration.getBuildVariant(selected));
    });
}

function doImportConfig(name, buildVariant){
    logger.info(`Importing "${name}" build variant`);

    let incsAndDefsImporter = new IncsAndDefsImporter(workspaceFolder);
    incsAndDefsImporter.import(buildVariant)
        .then(()=>{
            logger.info(`Done`);
        })
        .catch((error) => {
            logger.error(error);
            vscode.window.showErrorMessage('Bake: Import Failed! Check output window.');
        });
}

export default importConfig;