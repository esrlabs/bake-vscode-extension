"use strict";

import * as doT from "dot";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { globalState } from "../model/GlobalState";
import { createLogger } from "../util/logger";

const log = createLogger();

doT.templateSettings.strip = false;
doT.templateSettings.varname = "file";

const WORKSPACE_INCLUDE_PREFIX = "${workspaceRoot}/";

function fileCreator(fullFilename: string, template: string, name: string) {

    const transform = doT.template(template);
    const content = transform(
        {
            name,
            namespaces: detectNamespaces(path.dirname(fullFilename)),
            year: (new Date()).getFullYear().toString(),
        });

    fs.appendFile(fullFilename, content, () => {
        log.info("Opening " + fullFilename);
        vscode.workspace.openTextDocument(fullFilename).then((doc) => {
            vscode.window.showTextDocument(doc);
        });
    });
}

function detectNamespaces(folder: string): string[] {
    folder = vscode.workspace.asRelativePath(folder);

    const includePath = findMatchingIncludePath(folder);

    if (!includePath) {
        log.info("Namespace detection heuristic failed. " + folder + " not covered by bake's include path?");
        return [];
    }

    const similarity = stringSimilarity(includePath, folder);
    const folderPathRelativeToIncludePath = folder.substring(similarity);
    const namespaces = splitBySeperator(folderPathRelativeToIncludePath);
    log.info("Detected namespaces: " + namespaces);
    return namespaces;
}

function splitBySeperator(p): string[] {
    if (p.length === 0) {
        return [];
    }

    if (p.startsWith(path.sep)) {
        p = p.substring(1);
    }

    return p.split(path.sep);
}

function findMatchingIncludePath(folder: string): string {
    let includes = globalState().getIncludes();
    if (includes.length === 0) {
        return "";
    }

    includes = includes.filter((p) => p.startsWith(WORKSPACE_INCLUDE_PREFIX));
    includes = includes.map((p) => p.substring(WORKSPACE_INCLUDE_PREFIX.length));
    includes.sort( (a, b) => {
        const simA = stringSimilarity(a, folder);
        const simB = stringSimilarity(b, folder);
        if (simA > simB) {
            return -1;
        }
        if (simA < simB) {
            return 1;
        }
        return 0;
    });

    const closestIncludePath = includes[0];
    const similarity = stringSimilarity(closestIncludePath, folder);
    return (similarity !== closestIncludePath.length) ? "" : closestIncludePath;
}

function stringSimilarity(a: string , b: string): number {
    let similarity = 0;
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a.charAt(i) !== b.charAt(i)) {
            break;
        }
        similarity++;
    }
    return similarity;
}

export default fileCreator;
