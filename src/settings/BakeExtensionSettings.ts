import * as vscode from 'vscode';
import logger from '../util/logger';
import * as util from 'util';
import {BuildVariant} from '../model/BuildVariant'

const EXAMPLE_VARIANT = {
    "project": "Spaceship3",
    "config": "arm-x64",
    "adapt": "host,unittest",
    "default": "true"
}

const EXAMPLE_VARIANT_NAME = "ExampleVariant"; //need to ignore that one

/**
 * Provides access to all bake-extension related settings in
 *   .vscode/settings.json
 */
export class BakeExtensionSettings{

    private config : vscode.WorkspaceConfiguration;
    private path = require('path');

    constructor(){
        this.config = vscode.workspace.getConfiguration('bake');
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

    getDefaultBuildVariant(): string{
        let targets = this.getBuildVariants();
        if (!targets || Object.keys(targets).length == 0){
            return null;
        }

        let defaultTarget = undefined;
        for (let name in targets){
            let target = targets[name];
            if (target && target.default != undefined &&
                target.default === "true"){
                    return name;
            }
        }

        return null;
    }

    getBuildVariants(): Object{
        let buildVariants = this.config.get("buildVariants");
        let copy = {};
        for (let key in buildVariants){
            if (key === EXAMPLE_VARIANT_NAME &&
                JSON.stringify(buildVariants[key]) === JSON.stringify(EXAMPLE_VARIANT)){
                continue; //ignore the example
            }

            copy[key] = buildVariants[key];
        }
        return copy;
    }

    areBuildVariantsDefined() : boolean {
        return Object.keys(this.getBuildVariants()).length > 0;
    }

    getNumberOfBuildVariants() : number {
        return Object.keys(this.getBuildVariants()).length;
    }

    getBuildVariant(name: string) : Object{
        let found = this.getBuildVariants()[name];
        if (!found){
            logger.error(`Build variant ${name} is not defined in settings`);
        }
        return found;
    }

    resolveImportsOfBuildVariant(buildVariant) : BuildVariant[] {
        logger.info(`Resolving imports of ${util.inspect(buildVariant)}`)
        if (!buildVariant.importFrom){
            logger.info(`No imports found, continuing with ${buildVariant.project} ${buildVariant.config} ${buildVariant.adapt}`)
            return [buildVariant];
        }
    
        return buildVariant.importFrom.reduce((buildVariants, name) => {
            logger.info(`Resolving variants of import ${name}`)
            let importedVariants = this.resolveImportsOfBuildVariant(this.getBuildVariant(name));
            buildVariants.push(...importedVariants);
            return buildVariants;
        }, buildVariant.project ? [buildVariant] : []);
    }    
}

export default BakeExtensionSettings;