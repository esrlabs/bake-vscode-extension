import * as vscode from 'vscode';
import logger from '../util/logger';

const EXAMPLE_VARIANT_NAME = "ExampleVariant"; //need to ignore that one

/**
 * Provides access to all bake-extension related settings in 
 *   .vscode/settings.json
 */
class BakeConfiguration{

    private config;

    constructor(){
        this.config = vscode.workspace.getConfiguration('bake');

        if (this.config.has("mainProject")){
            vscode.window.showWarningMessage("bake: setting bake.mainProject is deprecated. use bake.buildVariants instead.");
        }
        if (this.config.has("targetConfig")){
            vscode.window.showWarningMessage("bake: setting bake.targetConfig is deprecated. use bake.buildVariants instead.");
        }
        if (this.getNumberOfBuildVariants() == 0){
            vscode.window.showWarningMessage("bake: adjust setting bake.buildVariants to match your workspace's bake config.");
        }
    }

    getDefaultBuildVariant(){
        let targets = this.getBuildVariants();
        if (!targets || Object.keys(targets).length == 0){
            return null;
        }

        let defaultTarget = undefined;

        for (let name in targets){
            let target = targets[name];
            if (target.default != undefined &&
                target.default === "true"){
                    defaultTarget = targets[name];
                    break;
            }
        }

        return defaultTarget || targets[0];
    }

    getBuildVariants(): Object{
        let buildVariants = this.config.get("buildVariants");
        delete buildVariants[EXAMPLE_VARIANT_NAME];
        return buildVariants;
    }

    getNumberOfBuildVariants() : number {
        return Object.keys(this.getBuildVariants()).length;
    }

    getBuildVariant(name: string) : Object{
        return this.getBuildVariants()[name];
    }
}

export default BakeConfiguration;