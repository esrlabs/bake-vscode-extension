import * as util from "util";
import * as vscode from "vscode";
import BakeExtensionSettings from "../settings/BakeExtensionSettings";
import logger from "../util/logger";
import { createBuildTask } from "./TasksCommon";

/**
 * After the user selects a Project.meta the targets from it
 * will be presented in the build tasks list.
 *
 * This is realised with the registered TaskProvider.
 *
 * Please dispose the returned provider when the extension
 * is ended.
 *
 * @param context
 */
export function registerActiveBakeTasks(context: vscode.ExtensionContext) {
    return vscode.workspace.registerTaskProvider("bake", {
        provideTasks: (token?: vscode.CancellationToken) => {
            return createBuildTasksOfActiveBuildVariants();
        },
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
            // Refining tasks is not supported by VSCODE yet.
            // See https://github.com/Microsoft/vscode/issues/33523
            return undefined;
        },
    });
}

function createBuildTasksOfActiveBuildVariants(): vscode.Task[] {
    const configuration = new BakeExtensionSettings();
    const buildVariantsMap = configuration.getBuildVariants();

    return Object.keys(buildVariantsMap).map((variantName) => {
        const v = buildVariantsMap[variantName];
        logger.info(`Build variant to derive Tasks from:\n${util.inspect(v)}`);
        const name = `${variantName} -> '${v.config}' in ${v.project}`;
        return createBuildTask(name, v, "Bake Variant");
    });
}

