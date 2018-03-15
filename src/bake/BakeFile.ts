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

    getTargets() : Thenable<any> {
        let directory = this.getFolder()
        logger.info(`Reading bake targets from diectory ${directory}`)

        return vscode.workspace.openTextDocument(this.filePath)
        .then( document => {
            // Match all targets except those commented out
            let re = /^[^#A-Za-z0-9]*(?:ExecutableConfig|LibraryConfig|CustomConfig)\s+(\w*)/
            let matches = []
            for(var l=0; l<document.lineCount; ++l)
            {
                let line = document.lineAt(l)
                let match = line.text.match(re)
                if(match) {
                    matches.push(match[1])
                }
            }
            if (matches.length == 0) {
                throw new Error("Found no targets in bake Project.meta file.")
            } else {
                return matches
            }
        }).then(null, (e) => {
            logger.error("Found no targets in bake Project.meta file.")
            vscode.window.showErrorMessage(e.toString());
            throw e
        })
    }

    getBuildArguments(target: string) : string
    {
        return `-j6 -m ${this.getPathInWorkspace()} ${target} -a black`
    }
}

export default BakeFile;