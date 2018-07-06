import { BuildVariant } from "./BuildVariant";
import * as vscode from 'vscode'

const globalAny:any = global;

export function globalState() : GlobalState{
    if (!globalAny.bakeExtensionGlobalState){
        globalAny.bakeExtensionGlobalState = new GlobalState()
    }
    return globalAny.bakeExtensionGlobalState
}

class GlobalState{
    private activeIncludes : string[];
    private activeBuildVariants : BuildVariant[];

    constructor(){
        this.clear();
    }
    
    public clear(){
        this.activeIncludes = [];
        this.activeBuildVariants = [];
    }
    
    public addIncludes(includes : string[]){
        this.activeIncludes.push(...includes)
    }

    public addBuildVariant(buildVariant: BuildVariant){
        this.activeBuildVariants.push(buildVariant);
    }

    public getIncludes() : string[]{
        return this.activeIncludes;
    }

    public getBuildVariants() : BuildVariant[]{
        return this.activeBuildVariants;
    }

    public getWorkspaceFolder() : vscode.WorkspaceFolder{
        return vscode.workspace.workspaceFolders[0];
    }

    public getWorkspaceFolderPath() : string{
        return this.getWorkspaceFolder().uri.fsPath;
    }
}