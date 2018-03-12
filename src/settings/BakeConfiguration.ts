import * as vscode from 'vscode';
import BakeFile from '../bake/BakeFile'
import logger from '../util/logger';

const EXAMPLE_VARIANT = {
    "project": "MyMain",
    "config": "arm-x64",
    "default": "true"
}

const EXAMPLE_VARIANT_NAME = "ExampleVariant"; //need to ignore that one

/**
 * Provides access to all bake-extension related settings in
 *   .vscode/settings.json
 */
class BakeConfiguration{

    private config;
    private path = require('path')

    constructor(){
        this.config = vscode.workspace.getConfiguration('bake');

        if (this.config.has("mainProject")){
            vscode.window.showWarningMessage("bake: setting bake.mainProject is deprecated. use bake.buildVariants instead.");
        }
        if (this.config.has("targetConfig")){
            vscode.window.showWarningMessage("bake: setting bake.targetConfig is deprecated. use bake.buildVariants instead.");
        }
        /*
        if (this.getNumberOfBuildVariants() == 0){
            vscode.window.showWarningMessage("bake: adjust setting bake.buildVariants to match your workspace's bake config.");
        }
        */
    }

    createBuildVariant(project: BakeFile, target: string): Object {
        const relativePath = project.getPathInWorkspace()
        const existingVariants = this.getBuildVariants()
        // Check for existing matching configurations
        let name = `${project.getName()}_${target}`
        for (let variantName in existingVariants) {
            let variant = existingVariants[variantName]
            if (variant.importFrom){
                continue
            }
            if (relativePath === variant.project &&
                target == variant.config) {
                return variant
            }
            if (name == variantName)
            {
                throw new Error(`Unmatching variant already exists: ${name}`)
            }
        }
        // If there is a better way to create the JSON object, without going through a string,
        // please do not hesitate tp update
        let stringConfig = JSON.stringify({ "project": relativePath, "config": target, "default": "false" })
        return JSON.parse(stringConfig)
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
        for (let key in buildVariants){
            if (key === EXAMPLE_VARIANT_NAME &&
                JSON.stringify(buildVariants[key]) === JSON.stringify(EXAMPLE_VARIANT)){
                delete buildVariants[key]; //ignore the example
            }
        }
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