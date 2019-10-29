import * as vscode from "vscode";
import * as path from 'path';
import { createBuildVariantFrom } from "../model/BuildVariant";
import { createBakeWorkspace } from "../model/Workspace";
import { ProjectMetaFile } from "../model/ProjectMetaFile";
import { createBuildTask } from "./TasksCommon";

interface BakeTaskDefinition extends vscode.TaskDefinition {
    /**
     * The project name
     */
    project: string;

    /**
     * The config name containing in the project
     */
    config?: string;
}

export class BakeTaskProvider implements vscode.TaskProvider {
    static BakeType: string = 'bake';
    private bakePromise: Thenable<vscode.Task[]> | undefined = undefined;

    constructor(workspaceRoot: string) {
        let pattern = path.join(workspaceRoot, '{Project.meta,Adapt.meta}');
        let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        fileWatcher.onDidChange(() => this.bakePromise = undefined);
        fileWatcher.onDidCreate(() => this.bakePromise = undefined);
        fileWatcher.onDidDelete(() => this.bakePromise = undefined);
    }

    public provideTasks(): Thenable<vscode.Task[]> | undefined {
        if (!this.bakePromise) {
            this.bakePromise = getBakeTasks();
        }
        return this.bakePromise;
    }

    public resolveTask(task: vscode.Task): Thenable<vscode.Task> | undefined {
        if (task.definition.type == BakeTaskProvider.BakeType) {
            const definition: BakeTaskDefinition = <any>task.definition;
            // handle corner case when the project is in the root workspace folder
            const pattern = (definition.project === "" || definition.project === vscode.workspace.name) ?
                'Project.meta' : `'**/${definition.project}/Project.meta'`;
            return vscode.workspace.findFiles(pattern).then(async (uris) => {
                if (!uris.length) {
                    return undefined;
                }

                const project = new ProjectMetaFile(uris[0].fsPath);
                const config = definition.config || await project.getDefaultTarget();

                if (!config) {
                    // config is not specified, but no default config in the project
                    return undefined;
                }

                const buildVariant = createBuildVariantFrom(project, config);
                const name = definition.config ?
                    `'${config} in ${project.getName()}'` : `'Default (${config}) in ${project.getName()}'`;
                let new_task = createBuildTask(name, buildVariant);
                new_task.definition = task.definition;
                return Promise.resolve(new_task);
            });
        }
        return undefined;
    }
}

async function getBakeTasks(): Promise<vscode.Task[]> {
    let workspace = await createBakeWorkspace();

    let buildTasks : vscode.Task[] = [];
    for (const project of workspace.getProjectMetas()){
        let targets = await project.getTargets();
        for (const target of targets){
            const buildVariant = createBuildVariantFrom(project, target);
            const projectName = project.getName()
            const name = (buildVariant.project === projectName)?
                (`'${buildVariant.config}' in ${project.getName()}`) :
                (`'${buildVariant.config}' in ${project.getName()} (${buildVariant.project})`)
            buildTasks.push(createBuildTask(name, buildVariant));
        }
    }

    return Promise.resolve(buildTasks);
}
