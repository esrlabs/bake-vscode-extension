"use strict";

import * as vscode from "vscode";
import CppConfigFile from "../intellisense/CppConfigFile";
import { globalState } from "../model/GlobalState";
import { createLogger } from "../util/logger";

const log = createLogger();

/**
 * Clean command to be called from VSCode command menu.
 *
 * @param context
 */
export async function cleanIncludesAndDefines(context: vscode.ExtensionContext) {
    try {
        log.info("Cleaning includes and defines");

        //
        // Check some prerequisites first
        //
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("Bake: Open a workspace first");
            return;
        }

        const workspaceFolder = globalState().getWorkspaceFolderPath();
        log.info("Detected workspace folder: " + workspaceFolder);

        const cppConfigFile = new CppConfigFile(workspaceFolder);
        if (!cppConfigFile.exists()) {
            vscode.window.showErrorMessage('Bake: Create an IntelliSense config file (.vscode/c_cpp_properties.json) first. Command "C/Cpp: Edit Configuration..." and save');
            return;
        }

        cppConfigFile.cleanImportsAndDefines();

        globalState().clear();

        log.info("Cleaning includes and defines done");
    } catch (error) {
        log.error(error);
        vscode.window.showErrorMessage("Bake: Cleaning failed. Check output window.");
    }
}
