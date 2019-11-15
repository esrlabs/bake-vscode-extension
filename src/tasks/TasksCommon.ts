import { BuildVariant } from "../model/BuildVariant";
import { BakeExtensionSettings } from "../settings/BakeExtensionSettings";
import * as vscode from "vscode";
import { globalState } from "../model/GlobalState";

// FIXME: the next line assumes that we are working with one workspace only (should be the case most of time)
export function createBuildTask(name: string,
                                buildVariant: BuildVariant): vscode.Task {
    const settings = new BakeExtensionSettings();
    const problemMatcher = settings.getDefaultProblemMatcher();
    const commandLine = createBuildCommandLine(buildVariant, settings);
    const kind = {
        type: "bake",
        project: buildVariant.project,
        config: buildVariant.config
    };
    const task = new vscode.Task(kind, vscode.TaskScope.Workspace, name, "bake", new vscode.ShellExecution(commandLine));
    task.group = vscode.TaskGroup.Build;
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
    const project = (buildVariant.project === vscode.workspace.name || buildVariant.project === "") ? "." : buildVariant.project;
    return `bake -j${numCores} -m ${project} ${buildVariant.config} -a black ${doAdapt} ${doRun}`;
}
