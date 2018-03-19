import * as vscode from 'vscode';
import BakeFile from '../bake/BakeFile'
import logger from '../util/logger';

export interface ConfigurationVariant {
    project: string;
    config: string;
}

/**
 * Provides access to all bake-extension related settings in
 *   .vscode/settings.json
 */
export class BakeConfiguration{

    private config : vscode.WorkspaceConfiguration;
    private path = require('path');

    constructor(){
        this.config = vscode.workspace.getConfiguration('bake');

        if (this.config.has("mainProject")){
            vscode.window.showWarningMessage("bake: setting bake.mainProject is deprecated. Search for project targets wiht 'ctrl+p'.");
        }
        if (this.config.has("targetConfig")){
            vscode.window.showWarningMessage("bake: setting bake.targetConfig is deprecated. Search for project targets wiht 'ctrl+p'.");
        }
        if (this.config.has("buildVariants")){
            vscode.window.showWarningMessage("bake: setting bake.buildVariants is deprecated. Search for project targets wiht 'ctrl+p'.");
        }
    }

    createConfigurationVariant(project: BakeFile, target: string): ConfigurationVariant {
        const relativePath = project.getPathInWorkspace()
        let variant : ConfigurationVariant = {
            project: relativePath,
            config: target

        }
        return variant
    }

    getNumberOfParallelBuilds() {
        return this.config.get("parallelBuildNum")
    }

    getUnitTestAdaptType() : string {
        return this.config.get<string>("unitTestsAdapt")
    }

    shallUnitTestRunOnBuild() : boolean {
        return this.config.get<boolean>("runUnitTestsOnBuild")
    }

    getDefaultProblemMatcher() : string {
        return this.config.get<string>("defaultPromblemMatcher")
    }

}

export default BakeConfiguration;