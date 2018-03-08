import * as vscode from 'vscode'
import BakeExecutor from '../bake/BakeExecutor'
import logger from '../util/logger'

/**
 */
class BakeFile{

    private path = require('path')
    private filePath

    constructor(filePath: string){
        this.filePath = filePath
    }

    getName(): string {
        let directoryPath = this.getFolder()
        return this.path.basename(directoryPath)
    }

    getFolder(): string {
        return this.path.dirname(this.filePath)
    }

    getWorkpaceFolder() : string {
        let normalizedProjectPath = this.path.normalize(this.getFolder())
        for (let folder of vscode.workspace.workspaceFolders) {
            let normalizedWorkspace = this.path.normalize(folder.uri.fsPath)
            if (normalizedProjectPath.indexOf(normalizedWorkspace) == 0)
            {
                return normalizedWorkspace
            }
        }
        return null
    }
    
    getTargets() : Promise<any> {
        let directory = this.getFolder()
        logger.info(`Reading bake targets from diectory ${directory}`)
        let bakeExecutor = new BakeExecutor(directory)

        const bakeeExecutionPromise = bakeExecutor.execute(`--list`)
        return bakeeExecutionPromise.then((output) => {
            return new Promise((resolve, reject)=>{
                let re = /\*\s*(\w+)/g
                let matches = []
                output.replace(re, function(match, target) {
                    matches.push(target)
                    return target 
                })
                if (matches == null || matches.length == 0) {
                    logger.error(`Found no targets in bake Project.meta file.`)
                    reject("Failed to find any targets")
                } else {
                    // RegEx cannot return array of substring matches, so match again
                    resolve(matches)    
                }
            })
        }).catch((error) => {
            logger.error(error)
            throw new Error("Failed to execute bake. Is a recent version of bake installed?")
        })
    }
}

export default BakeFile;