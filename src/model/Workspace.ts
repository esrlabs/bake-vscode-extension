import ProjectMetaFile from './ProjectMetaFile'
import * as vscode from 'vscode'


export async function createBakeWorkspace(): Promise<BakeWorkspace>{
    let uris = await vscode.workspace.findFiles('**/Project.meta')
    let projectMetas = uris.map( uri => new ProjectMetaFile(uri.fsPath))
    let workspace = new BakeWorkspace(projectMetas)
    return Promise.resolve(workspace);
}

class BakeWorkspace{
    private projectMetaFiles : ProjectMetaFile[]

    constructor (projectMetaFiles : ProjectMetaFile[]){
        this.projectMetaFiles = projectMetaFiles;
    }

    public getProjectMetas() : ProjectMetaFile[]{
        return this.projectMetaFiles;
    }
}
