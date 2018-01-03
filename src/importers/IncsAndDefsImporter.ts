import IncsAndDefsExecutor from "../bake/IncsAndDefsExecutor";
import BakeConfiguration from "../settings/BakeConfiguration";
import CppConfigFile from '../intellisense/CppConfigFile';
import logger from '../util/logger';

const deepmerge = require("deepmerge");

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

class IncsAndDefsImporter{

    private incsAndDefsExecutor;
    private workspaceFolder;

    constructor(workspaceFolder){
        this.workspaceFolder= workspaceFolder;
        this.incsAndDefsExecutor = new IncsAndDefsExecutor(workspaceFolder);
    }

    import(buildVariant){
        let buildVariants = this.resolveImports(buildVariant);
    
        let bakeRuns = buildVariants.map((buildVariant) => {
            return this.incsAndDefsExecutor.execute(buildVariant.project, buildVariant.config);
        });
        return Promise.all(bakeRuns).then(results =>{
            let output = results.reduce( (prevVal, currentVal) => {
                return deepmerge(prevVal, currentVal);
            }, {includes : [], defines: []});
            return this.write(output.includes, output.defines);
        });
    }

    private resolveImports(buildVariant){
        if (!buildVariant.importFrom){
            return [buildVariant];
        }

        let bakeConfiguration = new BakeConfiguration();
        return buildVariant.importFrom.reduce((buildVariants, name) => {
            let importedVariants = this.resolveImports(bakeConfiguration.getBuildVariant(name));
            buildVariants.push(...importedVariants);
            return buildVariants;
        }, buildVariant.project ? [buildVariant] : []);
    }

    private write(collectedIncludes, collectedDefines) : Promise<void>{ 
        let cppConfigFile = new CppConfigFile(this.workspaceFolder);
        let cppConfig = cppConfigFile.read();

        cppConfig.configurations.forEach(element => {
            //set includes
            let includePaths: String[] = element.includePath;
            let updatedIncludePaths = includePaths.filter((include) => !include.startsWith(WORKSPACE_INCLUDE_PREFIX));
            let newIncludePaths : Set<string> = new Set(collectedIncludes); //assure each entry is unique
            updatedIncludePaths.push(...newIncludePaths); 
            element.includePath = updatedIncludePaths;
            
            //set defines
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