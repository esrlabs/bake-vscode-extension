'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {setWorkspaceToTarget, addTargetToWorkspace, registerBakeTasks} from './commands/selectConfiguration'
import newHeaderFile from './commands/newHeaderFile'
import newCppFile from './commands/newCppFile'

import { configure } from 'vscode/lib/testrunner';
import logger from './util/logger';

let bakeTaskProvider: vscode.Disposable | undefined;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    logger.info('Project.meta file(s) detected. Activating bake extension.');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('bake.setIncludesToTarget', (context) => {
        setWorkspaceToTarget(context);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('bake.addTargetToIncludes', (context) => {
        addTargetToWorkspace(context);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('bake.createNewHeaderFile', (context) => {
        newHeaderFile(context);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('bake.createNewCppFile', (context) => {
        newCppFile(context);
    });
    context.subscriptions.push(disposable);

    bakeTaskProvider = registerBakeTasks(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (bakeTaskProvider) {
        bakeTaskProvider.dispose();
    }
}