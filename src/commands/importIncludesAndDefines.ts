"use strict";

import * as util from "util";
import * as vscode from "vscode";

import IncsAndDefsImporter from "../importers/IncsAndDefsImporter";
import CppConfigFile from "../intellisense/CppConfigFile";
import { BuildVariant, createBuildVariantFrom } from "../model/BuildVariant";
import { globalState } from "../model/GlobalState";
import { createBakeWorkspace } from "../model/Workspace";
import BakeExtensionSettings from "../settings/BakeExtensionSettings";
import logger from "../util/logger";

/**
 * Import command to be called from VSCode command menu.
 *
 * @param context
 */
export async function importIncludesAndDefines(context: vscode.ExtensionContext) {
    logger.info("displaying importIncludesAndDefines command");

    //
    // Check some prerequisites first
    //
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Bake: Open a workspace first");
        return;
    }

    logger.info("Assuming workspace folder: " + globalState().getWorkspaceFolderPath());

    const cppConfigFile = new CppConfigFile(globalState().getWorkspaceFolderPath());
    if (!cppConfigFile.exists()) {
        vscode.window.showErrorMessage('Bake: Create an IntelliSense config file (.vscode/c_cpp_properties.json) first. Command "C/Cpp: Edit Configuration..." and save');
        return;
    }

    const options: vscode.QuickPickOptions = {
        placeHolder: "Import C++ Includes and Defines from Bake - Select Project",
        matchOnDescription: true,
        matchOnDetail: true,
    };

    let choices = [];

    const bakeSettings = new BakeExtensionSettings();

    if (bakeSettings.areBuildVariantsDefined()) {
        const buildVariants = bakeSettings.getBuildVariants();
        const defaultBuildVariant = bakeSettings.getDefaultBuildVariant();
        choices = Object.keys(buildVariants).map((name) => {
            const v = buildVariants[name];
            const isDefault = (name === defaultBuildVariant);
            const anyImports = (v.importFrom ? `includes ${v.importFrom.reduce((sum, e) => `${sum} ${e}`, "")}` : undefined);
            const desc = (isDefault ? "*default* " : "") + (anyImports ? `from settings.json` : `from settings.json: project=${v.project} config=${v.config} ${v.adapt ? "adapt=" + v.adapt : ""}`);
            return {
                label: name,
                description: desc,
                detail: anyImports,
                predefinedBuildVariant: v,
            };
        });
    }

    choices.push({
        label: "Search for bake projects", description: "Search for Project.meta files in your workspace",
    });

    const selection = await vscode.window.showQuickPick(choices, options);
    if (!selection) {
        return;
    }

    try {
        if (selection.predefinedBuildVariant) {
            vscode.window.setStatusBarMessage(`Start import of C++ Includes and Defines`, 5000);
            await doImportBuildVariantFromSettings(selection.label, selection.predefinedBuildVariant);
        } else {
            await doImportBySearch(context);
        }
        vscode.window.setStatusBarMessage(`Import C++ Includes and Defines from Bake done`, 5000);
    } catch (error) {
        logger.error(error);
        vscode.window.showErrorMessage("Importing C++ Includes and Defines failed! Check bake tab of the output window for details.");
    }
}

async function doImportBySearch(context: vscode.ExtensionContext) {
    const options: vscode.QuickPickOptions = {
        placeHolder: "By search - select project",
        matchOnDescription: true,
        matchOnDetail: true,
    };

    const bakeWorkspace = await createBakeWorkspace();
    const projectMetas = bakeWorkspace.getProjectMetas();
    const projectSelection = await vscode.window.showQuickPick(
        projectMetas.map((p) => ({ label: p.getName(), description: p.getFolderPath(), ctxt: p })),
        options,
    );

    if (!projectSelection) {
        return; // user project  selection
    }

    const projectMeta = projectSelection.ctxt;
    const targets = await projectMeta.getTargets();
    options.placeHolder = `Select target for project ${projectMeta.getName()}`;
    const targetselection = await vscode.window.showQuickPick(targets, options);

    if (!targetselection) {
        return; // user canceled target selection
    }

    const buildVariant = createBuildVariantFrom(projectMeta, targetselection);

    options.placeHolder = `What do you want to do with the Includes and Defines defined by ${projectMeta.getName()} and ${targetselection}`;
    const modeSelection = await vscode.window.showQuickPick([
        { label: "Add", description: "add the new Includes and Defines to the existing one" },
        { label: "Replace", description: "replace the existing Includes and Defines " }],
        options);

    if (!modeSelection) {
        return; // user canceled mode selection
    }

    const incsAndDefsImporter = new IncsAndDefsImporter(globalState().getWorkspaceFolderPath());
    if (modeSelection.label === "Replace") {
        await incsAndDefsImporter.importExclusively(buildVariant);
    } else if (modeSelection.label === "Add") {
        await incsAndDefsImporter.addImport(buildVariant);
    }

}

export async function doImportBuildVariantFromSettings(name, buildVariant) {
    logger.info(`Importing "${name}" build variant`);

    const settings = new BakeExtensionSettings();
    const buildVariants = settings.resolveImportsOfBuildVariant(buildVariant);

    logger.info(`Build variant "${name}" is defined as:\n${util.inspect(buildVariants)}`);

    const incsAndDefsImporter = new IncsAndDefsImporter(globalState().getWorkspaceFolderPath());

    await incsAndDefsImporter.importAll(buildVariants);

    logger.info(`Importing "${name}" build variant done`);
}
