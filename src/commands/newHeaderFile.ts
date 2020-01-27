"use strict";

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import HeaderFileTemplate from "../settings/HeaderFileTemplate";
import fileCreator from "../util/fileCreator";
import { createLogger } from "../util/logger";

const log = createLogger();

function newHeaderFile(context) {
    if (!context || !context.path) {
        log.error("no folder context given");
        vscode.window.showErrorMessage("command needs to be invoked from context menu of file explorer");
        return;
    }

    const template: string = (new HeaderFileTemplate()).load();
    if (!template) {
        log.error("No template.h yet - try again");
        return;
    }

    try {
        createNewHeaderFile(template, context.path);
    } catch (err) {
        log.error(err);
    }
}

function createNewHeaderFile(template: string, folder: string) {
    folder = fs.lstatSync(folder).isFile() ? path.dirname(folder) : folder;
    log.info("Creating file at " + folder);

    vscode.window.showInputBox({
        prompt: ".h name (without ending):",
        value: "NewClass",
    }).then((name) => {
        const filename = name + ".h";
        const fullFilename = path.join(folder, filename);

        if (fs.existsSync(fullFilename)) {
            vscode.window.showErrorMessage(`File ${filename} already exists`);
            return;
        }

        log.info("creating " + fullFilename);
        fileCreator(fullFilename, template, name);
    });
}

export default newHeaderFile;
