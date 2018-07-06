import * as vscode from "vscode";
import ProjectMetaFile from "./ProjectMetaFile";

export async function createBakeWorkspace(): Promise<BakeWorkspace> {
    const uris = await vscode.workspace.findFiles("**/Project.meta");
    const projectMetas = uris.map( (uri) => new ProjectMetaFile(uri.fsPath));
    const workspace = new BakeWorkspace(projectMetas);
    return Promise.resolve(workspace);
}

class BakeWorkspace {
    private projectMetaFiles: ProjectMetaFile[];

    constructor(projectMetaFiles: ProjectMetaFile[]) {
        this.projectMetaFiles = projectMetaFiles;
    }

    public getProjectMetas(): ProjectMetaFile[] {
        return this.projectMetaFiles;
    }
}
