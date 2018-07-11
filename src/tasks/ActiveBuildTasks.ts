import * as util from "util";
import * as vscode from "vscode";
import { globalState } from "../model/GlobalState";
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
    const activeBuildVariants = globalState().getBuildVariants();

    logger.info(`Active build variants to derive Tasks from:\n${util.inspect(activeBuildVariants)}`);

    return activeBuildVariants.map((v) => {
        const name = `active: Build project=${v.project} config=${v.config} ${v.adapt ? "adapt=" + v.adapt : ""}`;
        return createBuildTask(name, v);
    });
}

