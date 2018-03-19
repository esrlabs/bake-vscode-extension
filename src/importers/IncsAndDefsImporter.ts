import IncsAndDefsExecutor from "../bake/IncsAndDefsExecutor";
import {BakeConfiguration, ConfigurationVariant} from "../settings/BakeConfiguration";
import CppConfigFile from '../intellisense/CppConfigFile';
import logger from '../util/logger';

import * as vscode from 'vscode'

const globalAny:any = global;

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

class IncsAndDefsImporter{

    private incsAndDefsExecutor: IncsAndDefsExecutor;
    private workspaceFolder;

    constructor(workspaceFolder){
        this.workspaceFolder= workspaceFolder;
        this.incsAndDefsExecutor = new IncsAndDefsExecutor(workspaceFolder);
    }

    import(buildVariant : ConfigurationVariant){
        let update = this.incsAndDefsExecutor.execute(buildVariant.project, buildVariant.config)
        return update.then(result =>{
            return this.write(result.includes, result.defines);
        });
    }

    addImport(buildVariant : ConfigurationVariant){
        let update = this.incsAndDefsExecutor.execute(buildVariant.project, buildVariant.config)
        return update.then(result =>{
            return this.write(result.includes, result.defines, false);
        });
    }

    private write(collectedIncludes, collectedDefines, overwrite = true) : Promise<void>{
        let cppConfigFile = new CppConfigFile(this.workspaceFolder);
        let cppConfig = cppConfigFile.read();

        globalAny.bake = {includes: collectedIncludes}; //memorize globally to allow namespace heuristic for new .h/.cpp files

        cppConfig.configurations.forEach(element => {
            //set includes
            let includePaths: string[] = element.includePath;
            let existingIncludePaths: string[] = includePaths

            if (overwrite) {
                // Only keep the ones outside the workspace
                existingIncludePaths = includePaths.filter((include) => !include.startsWith(WORKSPACE_INCLUDE_PREFIX));
            }
            // Make sure workspace paths all have same format
            collectedIncludes = collectedIncludes.map(p => p.replace(/\\/g, "/"))
            let newIncludePaths : Set<string> = new Set(collectedIncludes); //assure each entry is unique
            existingIncludePaths.forEach( e => newIncludePaths.add(e) )
            element.includePath = Array.from(newIncludePaths)

            //set defines
            // TODO: To filter the defines correctly we need to know which are contributed
            let newDefines = new Set(element.defines);
            collectedDefines.forEach(element => {
                newDefines.add(element);
            });
            element.defines = [...newDefines];
        });
        cppConfigFile.write(cppConfig);

        return Promise.resolve();
    }
}

export default IncsAndDefsImporter;