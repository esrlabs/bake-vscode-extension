"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {cleanIncludesAndDefines} from "./commands/cleanIncludesAndDefines";
import {doImportBuildVariantFromSettings, importIncludesAndDefines} from "./commands/importIncludesAndDefines";
import {registerBakeTasks} from "./tasks/BuildTasks";

import newCppFile from "./commands/newCppFile";
import newHeaderFile from "./commands/newHeaderFile";

import { BakeExtensionSettings } from "./settings/BakeExtensionSettings";
import logger from "./util/logger";

let bakeTaskProvider: vscode.Disposable | undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(cntxt: vscode.ExtensionContext) {

    logger.info("Project.meta file(s) detected. Activating bake extension.");

    // These commands have been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    registerCommand(cntxt, "bake.createNewHeaderFile", (context) => {
        newHeaderFile(context);
    });

    registerCommand(cntxt, "bake.createNewCppFile", (context) => {
        newCppFile(context);
    });

    registerCommand(cntxt, "bake.importIncludesAndDefines", (context) => {
        importIncludesAndDefines(context);
    });

    registerCommand(cntxt, "bake.cleanIncludesAndDefines", (context) => {
        cleanIncludesAndDefines(context);
    });

    bakeTaskProvider = registerBakeTasks(cntxt);

    warnOnDeprecated();

    await importDefaultBuildVariant();
}

function registerCommand(context: vscode.ExtensionContext, id: string, callback: (...args: any[]) => any, thisArg?: any) {
    logger.info("Registering command " + id);
    const disposable = vscode.commands.registerCommand(id, callback);
    context.subscriptions.push(disposable);
}

async function importDefaultBuildVariant() {
    const settings = new BakeExtensionSettings();
    const name = settings.getDefaultBuildVariant();
    if (name) {
        logger.info(`Found default build variant ${name} in settings.json - auto importing it`);

        await doImportBuildVariantFromSettings(name, settings.getBuildVariant(name));
    }
    vscode.window.setStatusBarMessage(`Auto imported C++ Includes and Defines from Bake done`, 5000);
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (bakeTaskProvider) {
        bakeTaskProvider.dispose();
    }
}

function warnOnDeprecated() {
    const config = vscode.workspace.getConfiguration("bake");

    if (config.has("mainProject")) {
        vscode.window.showWarningMessage("bake: setting bake.mainProject is deprecated. Search for project targets wiht 'ctrl+shift+p'.");
    }
    if (config.has("targetConfig")) {
        vscode.window.showWarningMessage("bake: setting bake.targetConfig is deprecated. Search for project targets wiht 'ctrl+shift+p'.");
    }
}
