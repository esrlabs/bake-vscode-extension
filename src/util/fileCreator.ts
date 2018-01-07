'use strict';

import logger from '../util/logger';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as doT from 'dot';

doT.templateSettings.strip = false;
doT.templateSettings.varname = 'file';

const globalAny:any = global;

const WORKSPACE_INCLUDE_PREFIX = '${workspaceRoot}/';

function fileCreator(fullFilename: string, template: string, name: string){

    let transform = doT.template(template);
    let content = transform(
        {
            name: name,
            namespaces: detectNamespaces(path.dirname(fullFilename)),
            year: (new Date()).getFullYear().toString()
        });

    fs.appendFile(fullFilename, content, () => {
        logger.info("Opening " + fullFilename);
        vscode.workspace.openTextDocument(fullFilename).then(doc=>{
            vscode.window.showTextDocument(doc);
        });
    });
}

function detectNamespaces(folder: string) : string[]{
    folder = vscode.workspace.asRelativePath(folder);

    let includePath = findMatchingIncludePath(folder);

    if (!includePath){
        logger.info('Namespace detection heuristic failed. ' + folder + ' not covered by bake\'s include path?');
        return [];
    }

    let similarity = stringSimilarity(includePath, folder);
    let folderPathRelativeToIncludePath = folder.substring(similarity);
    let namespaces = splitBySeperator(folderPathRelativeToIncludePath);
    logger.info('Detected namespaces: ' + namespaces);
    return namespaces;
}

function splitBySeperator(p) : string[] {
    if (p.length === 0){
        return [];
    }

    if (p.startsWith(path.sep)){
        p = p.substring(1);
    }

    return p.split(path.sep);
}

function findMatchingIncludePath(folder: string) : string {
    if (!globalAny.bake || !globalAny.bake.includes){
        return "";
    }

    let includes : string[] = globalAny.bake.includes;
    if (includes.length == 0){
        return "";        
    }

    includes = includes.filter(p => p.startsWith(WORKSPACE_INCLUDE_PREFIX));
    includes = includes.map(p => p.substring(WORKSPACE_INCLUDE_PREFIX.length));
    includes.sort( (a,b) => {
        let simA = stringSimilarity(a, folder);
        let simB = stringSimilarity(b, folder);
        if (simA > simB){
            return -1;
        }
        if (simA < simB){
            return 1;
        }
        return 0;
    });

    let closestIncludePath = includes[0];
    let similarity = stringSimilarity(closestIncludePath, folder);
    return (similarity != closestIncludePath.length) ? "" : closestIncludePath;
}

function stringSimilarity(a : string , b : string) : number{
    let similarity = 0;
    for (let i = 0; i < a.length && i < b.length; i++){
        if (a.charAt(i) !== b.charAt(i)){
            break;
        } 
        similarity++;
    }
    return similarity;
}

export default fileCreator;