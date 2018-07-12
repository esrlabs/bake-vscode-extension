import { BuildVariant } from "../model/BuildVariant";
import { BakeExtensionSettings } from "../settings/BakeExtensionSettings";
import * as vscode from "vscode";
import { globalState } from "../model/GlobalState";

// FIXME: the next line assumes that we are working with one workspace only (should be the case most of time)
export function createBuildTask(name: string,
                                buildVariant: BuildVariant,
                                type: string,
                                folder = globalState().getWorkspaceFolder()): vscode.Task {
    const settings = new BakeExtensionSettings();
    const problemMatcher = settings.getDefaultProblemMatcher();
    const commandLine = createBuildCommandLine(buildVariant, settings);
    const kind = {
        label: name,
        type: "shell",
        command: commandLine
    };
    const task = new vscode.Task(kind, folder, name , type);
    task.group = vscode.TaskGroup.Build;
    task.execution = new vscode.ShellExecution(commandLine);
    if (problemMatcher) {
        task.problemMatchers.push(problemMatcher);
    }
    return task;
}

function createBuildCommandLine(buildVariant: BuildVariant, settings: BakeExtensionSettings ){
    const numCores = settings.getNumberOfParallelBuilds();
    const adaptCompiler = settings.getUnitTestAdaptType();
    const runTestsOnBuild = settings.shallUnitTestRunOnBuild();
    const isUnittest = buildVariant.config.toLowerCase().includes("unittest");
    const doAdapt = buildVariant.adapt ? `--adapt ${buildVariant.adapt}` : (isUnittest && adaptCompiler) ? `--adapt ${adaptCompiler}` : "";
    const doRun =  (isUnittest && runTestsOnBuild) ? "--do run" : "";
    return `bake -j${numCores} -m ${buildVariant.project} ${buildVariant.config} -a black ${doAdapt} ${doRun}`;
}
