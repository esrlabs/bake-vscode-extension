import IncsAndDefsExecutor from "../bake/IncsAndDefsExecutor";
import {BuildVariant} from "../model/BuildVariant";
import CppConfigFile from '../intellisense/CppConfigFile';
import logger from '../util/logger';
import * as util from 'util'
import { globalState } from "../model/GlobalState";

class IncsAndDefsImporter{

    private incsAndDefsExecutor: IncsAndDefsExecutor;
    private workspaceFolder;
    private cppConfigFile: CppConfigFile;

    constructor(workspaceFolder){
        this.workspaceFolder= workspaceFolder;
        this.incsAndDefsExecutor = new IncsAndDefsExecutor(workspaceFolder);
        this.cppConfigFile = new CppConfigFile(workspaceFolder);
    }

    async importAll(buildVariants : BuildVariant[]){
        logger.info(`Importing ${util.inspect(buildVariants)} exclusivly`)

        this.cppConfigFile.cleanImportsAndDefines();

        for (let i = 0; i < buildVariants.length; ++i){
            await this.addImport(buildVariants[i]);
        }
    }

    async importExclusively(buildVariant : BuildVariant){
        logger.info(`Importing ${util.inspect(buildVariant)} exclusivly`)
        let update = this.incsAndDefsExecutor.execute(buildVariant.project, buildVariant.config, buildVariant.adapt)
        return update.then(result =>{
            this.cppConfigFile.cleanImportsAndDefines();
            this.cppConfigFile.addImportsAndDefines(result.includes, result.defines);
            globalState().clear();
            globalState().addIncludes(result.includes)
            globalState().addBuildVariant(buildVariant);
        });
    }

    async addImport(buildVariant : BuildVariant){
        logger.info(`Importing ${util.inspect(buildVariant)}`)
        let update = this.incsAndDefsExecutor.execute(buildVariant.project, buildVariant.config, buildVariant.adapt)
        return update.then(result =>{
            this.cppConfigFile.addImportsAndDefines(result.includes, result.defines);
            globalState().addIncludes(result.includes)
            globalState().addBuildVariant(buildVariant);
        });
    }

    
}

export default IncsAndDefsImporter;