'use strict';

import * as vscode from 'vscode'

import IncsAndDefsImporter from '../importers/IncsAndDefsImporter'
import BakeConfiguration from '../settings/BakeConfiguration'
import BakeFile from '../bake/BakeFile'
import logger from '../util/logger'
import { resolve } from 'url';

let path = require('path')

let bakeTaskProvider: vscode.Disposable | undefined;
let bakeFile: BakeFile | undefined;
let selectedTarget: string | undefined;


/**
 * Lets the user select a project meta for later builds.
 *
 * @param context
 */
export function selectProject(context: vscode.ExtensionContext) {
    // Search method is used as a promise elsewhere and is seperated into own function
    searchAndSelectProject()
}

/**
 * Lets the user first select and then open a project meta file.
 *
 * @param context
 */
export function openProject(context: vscode.ExtensionContext) {
    let bakeFilePromise = searchAndSelectProject()
    bakeFilePromise.then( (file) => {
        return vscode.workspace.openTextDocument(file.getFilePath())
    }).then(doc => {
        return vscode.window.showTextDocument(doc)
    }).catch( (error) => {
        logger.error(error)
        throw new Error(`Could not open file`)
    })
}

/**
 * Lets the user select first a project meta and then a target from it.
 *
 * Will then update all includes/defines according to selected file.
 *
 * @param context
 */
export function selectAndConfigureTarget(context: vscode.ExtensionContext) {
    let selectedTargetPromise = searchAndSelectTarget()
    selectedTargetPromise.then( target => {
        return new Promise( (resolve, reject) => {
            if (target == null) {
                this.reject()
            } else {
                setIncludePaths(bakeFile, target).then(() => {
                    vscode.window.setStatusBarMessage(`Done loading includes and defines.`, 5000)
                }).catch( (error) => {
                    logger.error(error)
                    vscode.window.setStatusBarMessage(`Error while loading the include paths`, 10000)
                })
            }
        })
    })
}


/**
 * After the user selects a Project.meta the targets from it
 * will be presented in the build tasks list.
 *
 * This is realised with the registered TaskProvider.
 *
 * Please dispose the returned provider when the extension
 * is ended.
 *
 * @param context
 */
export function registerBakeTasks(context: vscode.ExtensionContext) {
    bakeTaskProvider = vscode.workspace.registerTaskProvider('bake', {
        provideTasks: (token?: vscode.CancellationToken) => {
            return getAvailableBuildTasks()
        },
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken): vscode.Task | undefined {
            // Not applicable. Created tasks always have an execution part
            return undefined;
        }
    });
    return bakeTaskProvider
}


async function getAvailableBuildTasks() : Promise<vscode.Task[]> {
    if (bakeFile != undefined) {
        logger.info(`Search for build targets in ${bakeFile.getFilePath()}`)
        return bakeFile.getTargets().then( (targets) => {
            let tasks = []
            if (selectedTarget) {
                // If a target is explicitly selected - present it first
                let commandLine = `bake ${bakeFile.getBuildArguments(selectedTarget)}`
                let execution = new vscode.ShellExecution(commandLine)
                let name = `--> Build selected target '${selectedTarget}' (${bakeFile.getName()})`
                let task = new vscode.Task({ type: `bake ${name}`}, bakeFile.getWorkspaceFolder(), name , "bake",  execution, "$gcc")
                task.group = vscode.TaskGroup.Build
                tasks.push(task)
            }

            targets.forEach(target => {
                // Allow the user to search for the rest of the targets in the selected bake file
                let commandLine = `bake ${bakeFile.getBuildArguments(target)}`
                let execution = new vscode.ShellExecution(commandLine)
                let name = `Build '${target}'`
                let task = new vscode.Task({ type: `bake ${name}`}, bakeFile.getWorkspaceFolder(), name , "bake",  execution, "$gcc")
                task.group = vscode.TaskGroup.Build
                tasks.push(task)
            })
            return tasks
        })
    } else {
        return []
    }
}

async function searchAndSelectProject() : Promise<BakeFile> {
    //Let user select which config to import
    let allFilesPromise = vscode.workspace.findFiles('**/Project.meta')
    let selectProjectPromise = allFilesPromise.then( foundBakeUris => { return selectProjectMetaFile(foundBakeUris) })
    return selectProjectPromise.then( selectedPathItem => {
        if(selectedPathItem && (bakeFile == null || bakeFile.getFilePath() != selectedPathItem.path)) {
            bakeFile = new BakeFile(selectedPathItem.path)
            selectedTarget = null
        }
        return bakeFile
    })
}

async function searchAndSelectTarget() : Promise<string> {
    let projectPromise
    if(bakeFile) {
        // If bake file is already selected - no need to do so again
        projectPromise = Promise.resolve(bakeFile)
    } else {
        projectPromise = searchAndSelectProject()
    }

    let possibleTargetPromise = projectPromise.then( (file) => { return bakeFile.getTargets() })
    let selectedTargetPromise = possibleTargetPromise.then( bakeTargets => {
        let options = { placeHolder: `Select target in ${bakeFile.getName()}` }
        return vscode.window.showQuickPick(bakeTargets, options)
    }).then( target => {
        if (target) {
            logger.info(`Selected target ${target} for further builds`)
            selectedTarget = target
        }
        return target
    })
    return selectedTargetPromise
}

function selectProjectMetaFile(bakeFileUris) : Thenable<any> {
    let bakeFiles = bakeFileUris.map(uri => {
        let folder = path.dirname(uri.fsPath)
        let name = path.basename(folder)
        return {
            path: uri.fsPath,
            label: name,
            description : folder
        }
     })
     let options = {
         placeHolder: "Search for and select Project.meta file",
         matchOnDescription: true
     }
    return vscode.window.showQuickPick(bakeFiles, options)
}

function setIncludePaths(bakeFile: BakeFile, selectedTarget: string) : Promise<any> {
    let configuration = new BakeConfiguration()
    let buildVariant = configuration.createBuildVariant(bakeFile, selectedTarget)
    let includeSetter = new IncsAndDefsImporter(bakeFile.getWorkspaceFolder().uri.fsPath)
    let importPromise = includeSetter.import(buildVariant)
    vscode.window.setStatusBarMessage(`Loading includes and defines for ${selectedTarget} in ${bakeFile.getFolderPath()}`, importPromise)
    return importPromise
}
