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
        let directoryPath = this.getFolderPath()
        return this.path.basename(directoryPath)
    }

    getFilePath(): string {
        return this.filePath
    }

    getFolderPath(): string {
        return this.path.dirname(this.filePath)
    }

    getWorkspaceFolder() : vscode.WorkspaceFolder {
        let normalizedProjectPath = this.path.normalize(this.getFolderPath())
        for (let folder of vscode.workspace.workspaceFolders) {
            let normalizedWorkspace = this.path.normalize(folder.uri.fsPath)
            if (normalizedProjectPath.indexOf(normalizedWorkspace) == 0)
            {
                return folder
            }
        }
        return null
    }

    getPathInWorkspace() : string {
        let folder = this.getWorkspaceFolder()
        let relativePath = this.path.relative(folder.uri.fsPath, this.getFolderPath())
        // Convert to slashes...
        return relativePath.replace("\\", "/")
    }

    getTargets() : Promise<any> {
        let directory = this.getFolderPath()
        logger.info(`Reading bake targets from diectory ${directory}`)
        let bakeExecutor = new BakeExecutor(directory)

        const bakeExecutionPromise = bakeExecutor.execute(`--list`)
        return bakeExecutionPromise.then((output) => {
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
            throw new Error("Bake failed to find targets. Does the meta file have targets? Is installed bake up-to-date?")
        })
    }

    getBuildArguments(target: string) : string
    {
        return `-j6 -m ${this.getPathInWorkspace()} ${target} -a black`
    }
}

export default BakeFile;