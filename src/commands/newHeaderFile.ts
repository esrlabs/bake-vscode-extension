'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import logger from '../util/logger';
import fileCreator from '../util/fileCreator';
import HeaderFileTemplate from '../settings/HeaderFileTemplate';

function newHeaderFile(context){
    if (!context || !context.path){
        logger.error("no folder context given");
        vscode.window.showErrorMessage('command needs to be invoked from context menu of file explorer');
        return;
    }

    let template : string = (new HeaderFileTemplate()).load();
    if (!template){
        logger.error('No template.h yet - try again');
        return;
    }

    try{
        createNewHeaderFile(template, context.path);
    } catch(err){
        logger.error(err);
    }
}

function createNewHeaderFile(template: string, folder: string){
    folder = fs.lstatSync(folder).isFile() ? path.dirname(folder) : folder;
    logger.info("Creating file at " + folder);

    vscode.window.showInputBox({
        prompt: ".h name (without ending):",
        value: "NewClass"
    }).then((name)=>{
        let filename = name + ".h";
        let fullFilename = path.join(folder, filename);
    
        if (fs.existsSync(fullFilename)){
            vscode.window.showErrorMessage(`File ${filename} already exists`);
            return;
        }
        
        logger.info("creating " + fullFilename);
        fileCreator(fullFilename, template, name);
    });
}

export default newHeaderFile;