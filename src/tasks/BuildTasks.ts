import * as vscode from 'vscode';
import { BakeExtensionSettings } from '../settings/BakeExtensionSettings';
import { BuildVariant } from '../model/BuildVariant';
import { globalState } from '../model/GlobalState';
import logger from '../util/logger';
import * as util from 'util';

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
    return vscode.workspace.registerTaskProvider('bake', {
        provideTasks: (token?: vscode.CancellationToken) => {
            return createBuildTasksOfActiveBuildVariants()
        },
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken):  vscode.ProviderResult<vscode.Task> {
            // Refining tasks is not supported by VSCODE yet.
            // See https://github.com/Microsoft/vscode/issues/33523
            return undefined
        }
    })
}

function createBuildTasksOfActiveBuildVariants() : vscode.Task[] {
    let activeBuildVariants = globalState().getBuildVariants();

    logger.info(`Active build variants to derive Tasks from:\n${util.inspect(activeBuildVariants)}`);

    return activeBuildVariants.map(v => createBuildTask(v));
}

export function createBuildTask(buildVariant: BuildVariant) : vscode.Task {
        let settings = new BakeExtensionSettings();
        let numCores = settings.getNumberOfParallelBuilds()
        let adaptCompiler = settings.getUnitTestAdaptType()
        let runTestsOnBuild = settings.shallUnitTestRunOnBuild()
        let problemMatcher = settings.getDefaultProblemMatcher()
        let name = `Build project=${buildVariant.project} config=${buildVariant.config} ${buildVariant.adapt ? 'adapt=' + buildVariant.adapt : ''}`
        let isUnittest = buildVariant.config.toLowerCase().includes("unittest");
        let doAdapt = buildVariant.adapt ? `--adapt ${buildVariant.adapt}` : (isUnittest && adaptCompiler)? `--adapt ${adaptCompiler}` : ""
        let doRun =  (isUnittest && runTestsOnBuild) ? "--do run" : ""
        let commandLine = `bake -j${numCores} -m ${buildVariant.project} ${buildVariant.config} -a black ${doAdapt} ${doRun}`
        let kind = {
            type: "bake",
            target: buildVariant.config,
            file: buildVariant.project
        }
        //FIXME: the next line assumes that we are working with one workspace only (should be the case most of time)
        let task = new vscode.Task(kind, globalState().getWorkspaceFolder(), name , "bake")
        task.group = vscode.TaskGroup.Build
        task.execution = new vscode.ShellExecution(commandLine)
        if (problemMatcher) {
            task.problemMatchers.push(problemMatcher)
        }
        return task
    }
