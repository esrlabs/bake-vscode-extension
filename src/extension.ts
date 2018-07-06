'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {registerBakeTasks} from './tasks/BuildTasks'
import {importIncludesAndDefines, doImportBuildVariantFromSettings} from './commands/importIncludesAndDefines'
import {cleanIncludesAndDefines} from './commands/cleanIncludesAndDefines'

import newHeaderFile from './commands/newHeaderFile'
import newCppFile from './commands/newCppFile'

import logger from './util/logger';
import { BakeExtensionSettings } from './settings/BakeExtensionSettings';

let bakeTaskProvider: vscode.Disposable | undefined;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    logger.info('Project.meta file(s) detected. Activating bake extension.');

    // These commands have been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    registerCommand(context, 'bake.createNewHeaderFile', (context) => {
        newHeaderFile(context);
    });

    registerCommand(context, 'bake.createNewCppFile', (context) => {
        newCppFile(context);
    });

    registerCommand(context, 'bake.importIncludesAndDefines', (context) => {
        importIncludesAndDefines(context);
    });

    registerCommand(context, "bake.cleanIncludesAndDefines", (context) =>{
        cleanIncludesAndDefines(context)
    });

    bakeTaskProvider = registerBakeTasks(context);

    warnOnDeprecated()

    await importDefaultBuildVariant();
}

function registerCommand(context: vscode.ExtensionContext, id: string, callback: (...args: any[]) => any, thisArg?: any){
    logger.info('Registering command ' + id);
    let disposable = vscode.commands.registerCommand(id, callback);
    context.subscriptions.push(disposable);
}

async function importDefaultBuildVariant(){
    let settings = new BakeExtensionSettings();
    let name = settings.getDefaultBuildVariant();
    if (name){
        logger.info(`Found default build variant ${name} in settings.json - auto importing it`);
        
        await doImportBuildVariantFromSettings(name, settings.getBuildVariant(name));
    }
    vscode.window.setStatusBarMessage(`Auto imported C++ Includes and Defines from Bake done`, 5000)
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (bakeTaskProvider) {
        bakeTaskProvider.dispose();
    }
}

function warnOnDeprecated() {
    let config = vscode.workspace.getConfiguration('bake')

    if (config.has("mainProject")){
        vscode.window.showWarningMessage("bake: setting bake.mainProject is deprecated. Search for project targets wiht 'ctrl+shift+p'.");
    }
    if (config.has("targetConfig")){
        vscode.window.showWarningMessage("bake: setting bake.targetConfig is deprecated. Search for project targets wiht 'ctrl+shift+p'.");
    }
}