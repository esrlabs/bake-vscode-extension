'use strict';

import * as vscode from 'vscode'

import IncsAndDefsImporter from '../importers/IncsAndDefsImporter'
import BakeConfiguration from '../settings/BakeConfiguration'
import BakeFile from '../bake/BakeFile'
import logger from '../util/logger'

/**
 * Lets the user select first a project meta and then a target from it.
 *
 * Will then update all includes/defines according to selected file.
 *
 * @param context
 */
function selectConfiguration(context: vscode.ExtensionContext) {

    let workspaces = vscode.workspace.workspaceFolders
    let path = require('path')
    let bakeFile
    let workspaceFolder

    //Let user select which config to import
    vscode.workspace.findFiles('**/Project.meta')
    .then(foundBakeUris => {
        let bakeFiles = foundBakeUris.map(uri => {
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
    })
    .then( selectedPathItem => {
        bakeFile = new BakeFile(selectedPathItem.path)
        workspaceFolder = bakeFile.getWorkpaceFolder()
        return bakeFile.getTargets()
    })
    .then( bakeTargets => {
        let options = { placeHolder: `Select target in ${bakeFile.getName()}` }
        return vscode.window.showQuickPick(bakeTargets, options)
    })
    .then( selectedTarget => {
        let configuration = new BakeConfiguration()
        let buildVariant = configuration.createBuildVariant(bakeFile, selectedTarget)
        let includeSetter = new IncsAndDefsImporter(workspaceFolder)
        let importPromise = includeSetter.import(buildVariant)
        vscode.window.setStatusBarMessage(`Loading includes and defines for ${selectedTarget} in ${bakeFile.getFolder()}`, importPromise)
        return importPromise
    })
    .then( () =>{
        vscode.window.setStatusBarMessage(`Done loading includes and defines.`, 5000)
    })
}

export default selectConfiguration;