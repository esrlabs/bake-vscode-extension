import * as util from "util";
import * as vscode from "vscode";
import { BuildVariant } from "../model/BuildVariant";
import { globalState } from "../model/GlobalState";
import { BakeExtensionSettings } from "../settings/BakeExtensionSettings";
import logger from "../util/logger";

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
export function registerBakeTasks(context: vscode.ExtensionContext) {
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

    return activeBuildVariants.map((v) => createBuildTask(v));
}

export function createBuildTask(buildVariant: BuildVariant): vscode.Task {
        const settings = new BakeExtensionSettings();
        const numCores = settings.getNumberOfParallelBuilds();
        const adaptCompiler = settings.getUnitTestAdaptType();
        const runTestsOnBuild = settings.shallUnitTestRunOnBuild();
        const problemMatcher = settings.getDefaultProblemMatcher();
        const name = `Build project=${buildVariant.project} config=${buildVariant.config} ${buildVariant.adapt ? "adapt=" + buildVariant.adapt : ""}`;
        const isUnittest = buildVariant.config.toLowerCase().includes("unittest");
        const doAdapt = buildVariant.adapt ? `--adapt ${buildVariant.adapt}` : (isUnittest && adaptCompiler) ? `--adapt ${adaptCompiler}` : "";
        const doRun =  (isUnittest && runTestsOnBuild) ? "--do run" : "";
        const commandLine = `bake -j${numCores} -m ${buildVariant.project} ${buildVariant.config} -a black ${doAdapt} ${doRun}`;
        const kind = {
            type: "bake",
            target: buildVariant.config,
            file: buildVariant.project,
        };
        // FIXME: the next line assumes that we are working with one workspace only (should be the case most of time)
        const task = new vscode.Task(kind, globalState().getWorkspaceFolder(), name , "bake");
        task.group = vscode.TaskGroup.Build;
        task.execution = new vscode.ShellExecution(commandLine);
        if (problemMatcher) {
            task.problemMatchers.push(problemMatcher);
        }
        return task;
    }
