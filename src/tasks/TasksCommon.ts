import * as vscode from "vscode";
import { BuildVariant } from "../model/BuildVariant";
import { BakeExtensionSettings } from "../settings/BakeExtensionSettings";

export interface BakeTaskDefinition extends vscode.TaskDefinition {
    /**
     * The project name
     */
    project: string;

    /**
     * The config name containing in the project
     */
    config?: string;

    /**
     * Optional additional arguments for bake command
     */
    args?: string;
}

// FIXME: the next line assumes that we are working with one workspace only (should be the case most of time)
export function createBuildTask(name: string,
                                buildVariant: BuildVariant, args?: string): vscode.Task {
    const settings = new BakeExtensionSettings();
    const commandLine: string = createBuildCommandLine(buildVariant, settings, args);
    const kind: BakeTaskDefinition = {
        name: name,
        type: "bake",
        project: buildVariant.project,
        config: buildVariant.config,
        args: args
    };
    const task = new vscode.Task(kind, vscode.TaskScope.Workspace, name, "bake", new vscode.ShellExecution(commandLine));
    task.group = vscode.TaskGroup.Build;
    if (settings.defaultProblemMatcher) {
        task.problemMatchers.push(settings.defaultProblemMatcher);
    }
    return task;
}

function createBuildCommandLine(buildVariant: BuildVariant, settings: BakeExtensionSettings, args?: string) {
    const numCores = settings.parallelBuildNum;
    const adaptCompiler = settings.unitTestsAdapt;
    const runTestsOnBuild = settings.runUnitTestsOnBuild;
    const isUnittest = buildVariant.config.toLowerCase().includes("unittest");
    const doAdapt = buildVariant.adapt ? `--adapt ${buildVariant.adapt}` : (isUnittest && adaptCompiler) ? `--adapt ${adaptCompiler}` : "";
    const doRun =  (isUnittest && runTestsOnBuild) ? "--do run" : "";
    const project = (buildVariant.project === vscode.workspace.name || buildVariant.project === "") ? "." : buildVariant.project;
    let cmd = `bake -j${numCores} -m ${project} ${buildVariant.config} -a black ${doAdapt} ${doRun}`;
    if (args) {
        cmd += ` ${args}`;
    }
    return cmd;
}
