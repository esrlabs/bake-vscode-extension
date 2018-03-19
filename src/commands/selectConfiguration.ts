'use strict';

import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import IncsAndDefsImporter from '../importers/IncsAndDefsImporter'
import BakeConfiguration from '../settings/BakeConfiguration'
import BakeFile from '../bake/BakeFile'
import logger from '../util/logger'

interface BakeTargetItem extends vscode.QuickPickItem {
    bakeFile: BakeFile;
    target: string;
}

/**
 * Will repalce all includes/defines according what
 * target the user selects from the workspace.
 *
 * This will remove existing include paths within the
 * workspace.
 *
 * @param context
 */
export function setWorkspaceToTarget(context: vscode.ExtensionContext) {
    let targetItemPromise = searchAndSelectTarget()
    targetItemPromise.then( targetItem => {
        return new Promise( (resolve, reject) => {
            if (targetItem == null) {
                this.reject()
            } else {
                let configuration = new BakeConfiguration()
                let buildVariant = configuration.createConfigurationVariant(targetItem.bakeFile, targetItem.target)
                let includeSetter = new IncsAndDefsImporter(targetItem.bakeFile.getWorkspaceFolder().uri.fsPath)
                let importPromise = includeSetter.import(buildVariant)
                vscode.window.setStatusBarMessage(`Loading includes and defines for ${targetItem.target} in ${targetItem.bakeFile.getFolderPath()}`, importPromise)
                importPromise.then(() => {
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
 * Will update all includes/defines according what
 * target the user selects from the workspace.
 *
 * This will add to the existing include paths within the
 * workspace.
 *
 * @param context
 */
export function addTargetToWorkspace(context: vscode.ExtensionContext) {
    let targetItemPromise = searchAndSelectTarget()
    targetItemPromise.then( targetItem => {
        return new Promise( (resolve, reject) => {
            if (targetItem == null) {
                this.reject()
            } else {
                let configuration = new BakeConfiguration()
                let buildVariant = configuration.createConfigurationVariant(targetItem.bakeFile, targetItem.target)
                let includeSetter = new IncsAndDefsImporter(targetItem.bakeFile.getWorkspaceFolder().uri.fsPath)
                let importPromise = includeSetter.addImport(buildVariant)
                vscode.window.setStatusBarMessage(`Loading includes and defines for ${targetItem.target} in ${targetItem.bakeFile.getFolderPath()}`, importPromise)
                importPromise.then(() => {
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
    let bakeTaskProvider = vscode.workspace.registerTaskProvider('bake', {
        provideTasks: (token?: vscode.CancellationToken) => {
            return getAvailableBuildTasks()
        },
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken):  vscode.ProviderResult<vscode.Task> {
            // Refining tasks is not supported by VSCODE yet.
            // See https://github.com/Microsoft/vscode/issues/33523
            return undefined
        }
    })
    return bakeTaskProvider
}

/**
 * Will search for all targets in all Project.metas
 * and return them as vscode.Tasks
 */
async function getAvailableBuildTasks() : Promise<vscode.Task[]> {
    let targetPromises = getAvailableTargets()
    return targetPromises.then( promises => {
        return Promise.all(promises)
    }).then( targetItemArray => {
        // flatten
        return [].concat(... targetItemArray)
    }).then( (targetItems : BakeTargetItem[]) => {
        let tasks = []
        targetItems.forEach(item => {
            let task = item.bakeFile.createBuildTask(item.target)
            tasks.push(task)
        })
        return tasks
    })
}

/**
 * Allows to user to select a single bake target
 * choosen between all targets in workspace.
 */
async function searchAndSelectTarget() : Promise<BakeTargetItem> {
    let targetPromises = getAvailableTargets()
    return targetPromises.then( promises => {
        return Promise.all(promises)
    }).then( targetItemArray => {
        // flatten
        return [].concat(... targetItemArray)
    }).then( (targetItems : BakeTargetItem[]) => {
        let options : vscode.QuickPickOptions = {
            placeHolder: "Search and find bake target in all found Project.meta",
            matchOnDescription: true,
            matchOnDetail: true
        }
        return vscode.window.showQuickPick(targetItems, options)
    }).then( target => {
        if (target) {
            logger.info(`Selected target ${target.target} from ${target.bakeFile.getName()}`)
        }
        return target
    })
}

/**
 * Searches workspace for all targets in all Project.meta
 *
 * Will return the result as a list of promises - one
 * entry for each Project.meta together with the
 * targets in that file.
 */
async function getAvailableTargets() : Promise<Promise<BakeTargetItem[]>[]> {
    let allFilesPromise = vscode.workspace.findFiles('**/Project.meta')
    return allFilesPromise.then( foundBakeUris => {
        let createItems = async (f:BakeFile, folder, relativeFolder) : Promise<BakeTargetItem[]> => {
            let targets = await f.getTargets()
            return targets.map( t => {
                let item : BakeTargetItem = {
                    bakeFile: f,
                    target: t,
                    description: `Target ${t} in ${relativeFolder}`,
                    detail: folder,
                    label: t
                }
                return item
            })
        }
        let targetPromises = foundBakeUris.map (u => {
            let bakeFile = new BakeFile(u.fsPath)
            return createItems(bakeFile, bakeFile.getFolderPath(), bakeFile.getPathInWorkspace())
        })
        return targetPromises
    })
}
