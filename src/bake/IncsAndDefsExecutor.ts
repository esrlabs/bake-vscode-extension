import BakeExecutor from '../bake/BakeExecutor';
import BakeConfiguration from '../settings/BakeConfiguration'
import * as jsonfile from 'jsonfile';
import * as vscode from 'vscode';
import * as path from 'path';
import logger from '../util/logger';

interface WorkspaceUpdate {
    includes: string[];
    defines: string[];
}

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}';

/**
 * Runs bake with --incs-and-defs=json parameter
 */
class IncsAndDefsExecutor{

    private workspaceFolder: string;

    constructor(workspaceFolder: string){
        this.workspaceFolder = workspaceFolder;
    }

    /**
     * @param project the -m switch value given to bake
     * @param config the config to determine the incs-and-defs for
     * @return Promise resolved with an object {includes: string[], defines: [string] }
     */
    execute(project: string, config: string): Promise<WorkspaceUpdate>{
        let configuration = new BakeConfiguration()
        let adaptCompiler = configuration.getUnitTestAdaptType()
        let doAdapt = (config.toLowerCase().includes("unittest") && adaptCompiler)? `--adapt ${adaptCompiler} ` : ""
        let bakeExecutor = new BakeExecutor(this.workspaceFolder);

        logger.info(` Reading bake config for build variant project=${project} config=${config}`);
        return bakeExecutor.execute(`-m ${project} --incs-and-defs=json -a black ${doAdapt}${config}`)
            .then((output) => {
                return this.parseOutput(output);
            }).then((output) => {
                logger.info(` Reading bake config for build variant project=${project} config=${config} done`);
                return output;
            })
            .catch((error) => {
                logger.error(error);
                throw new Error("failed to execute bake. is a recent version of bake installed?");
            });
    }

    private parseOutput(output: string) : Promise<WorkspaceUpdate>{
        return new Promise((resolve, reject)=>{
            try {
                let bakeOutputAsObj = JSON.parse(output);
                resolve({
                    includes: this.collectIncludesFrom(bakeOutputAsObj),
                    defines: this.collectDefinesFrom(bakeOutputAsObj)
                });
            } catch (error) {
                logger.error('Failed to parse bake output: ' + error);
                if (output.length == 0){
                    logger.error('=> try to override the bake.config setting');
                } else {
                    logger.error(output);
                }
                reject("failed to parse bake output");
            }
        });
    }

    private collectIncludesFrom(bakeOutput): string[] {
        let collectedIncludes = new Set<string>();
        Object.keys(bakeOutput).forEach((key: string) => {
            let includes = bakeOutput[key].includes;
            let absDir = bakeOutput[key].dir;
            if (!absDir) {
                throw new Error('dir attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            let relativeDir = vscode.workspace.asRelativePath(absDir);

            if (includes) {
                includes.forEach(element => {
                    let include = WORKSPACE_INCLUDE_PREFIX + '/'
                        + path.normalize(path.join(relativeDir, element));
                    collectedIncludes.add(include);
                });
            }
        });
        return [...collectedIncludes];
    }

    private collectDefinesFrom(bakeOutput) : string[]{
        let collectedDefines = new Set<string>();
        Object.keys(bakeOutput).forEach((key: string) => {
            let cDefines = bakeOutput[key].c_defines;
            if (!cDefines) {
                throw new Error('c_defines attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            let cppDefines = bakeOutput[key].cpp_defines;
            if (!cppDefines) {
                throw new Error('cpp_defines attribute not found in bake output. bake version < 2.42.1? Then run "gem install bake-toolkit"');
            }

            cDefines.forEach(element => {
                collectedDefines.add(element);
            });
            cppDefines.forEach(element => {
                collectedDefines.add(element);
            });
        });
        return [...collectedDefines];
    }



}

export default IncsAndDefsExecutor