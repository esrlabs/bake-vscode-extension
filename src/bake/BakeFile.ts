import * as vscode from 'vscode'
import BakeConfiguration from '../settings/BakeConfiguration'
import logger from '../util/logger'

interface BakeTaskDefinition extends vscode.TaskDefinition {
    target?: string;
    file?: string;
}

/**
 */
class BakeFile{

    private path = require('path')
    private filePath

    constructor(filePath: string){
        this.filePath = filePath.replace(/\\/g, "/")
    }

    getName(): string {
        let directoryPath = this.getFolderPath()
        return this.path.basename(directoryPath)
    }

    getFilePath(): string {
        return this.filePath
    }

    getFolderPath(): string {
        return this.path.dirname(this.filePath).replace(/\\/g, "/")
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
        return relativePath.replace(/\\/g, "/")
    }

    getTargets() : Thenable<string[]> {
        let directory = this.getFolderPath()
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
                throw new Error(`Found no targets in bake Project.meta file ${this.getFilePath()}`)
            } else {
                return matches
            }
        }).then(null, (e) => {
            logger.error(e.toString())
            return []
        })
    }

    /**
     * Creates a VSCode build task that can be provided and
     * saved to build given target.
     *
     * @param target Name of a target in this Bake file.
     */
    createBuildTask(target: string) : vscode.Task {
        let configuration = new BakeConfiguration()
        let numCores = configuration.getNumberOfParallelBuilds()
        let adaptCompiler = configuration.getUnitTestAdaptType()
        let runTestsOnBuild = configuration.shallUnitTestRunOnBuild()
        let problemMatcher = configuration.getDefaultProblemMatcher()
        let path = this.getPathInWorkspace()
        let name = `Build '${target}' (${path})`
        let doAdapt = (target.toLowerCase().includes("unittest") && adaptCompiler)? `--adapt ${adaptCompiler}` : ""
        let doRun =  (target.toLowerCase().includes("unittest") && runTestsOnBuild)? "--do run" : ""
        let commandLine = `bake -j${numCores} -m ${path} ${target} -a black ${doAdapt} ${doRun}`
        let kind: BakeTaskDefinition = {
            type: "bake",
            target: target,
            file: path
        }
        let task = new vscode.Task(kind, this.getWorkspaceFolder(), name , "bake")
        task.group = vscode.TaskGroup.Build
        task.execution = new vscode.ShellExecution(commandLine)
        if (problemMatcher) {
            task.problemMatchers.push(problemMatcher)
        }
        return task
    }
}

export default BakeFile;