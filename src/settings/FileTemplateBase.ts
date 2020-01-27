"use strict";

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { createLogger } from "../util/logger";

const log = createLogger();

abstract class FileTemplateBase {

    public load(): string {

        const fileName = this.doGetFilename();
        const filePath = this.getFilePath();

        if (!fs.existsSync(filePath)) {
            log.info(filePath + " not found");
            this.createTemplateFile(fileName, this.doGetDefaultContent());
            return null;
        }

        return this.readTemplateFile(fileName);
    }

    protected readTemplateFile(filename: string): string {
        const filePath = path.join(vscode.workspace.rootPath, ".vscode", filename);
        return fs.readFileSync(filePath, {encoding: "utf8"});
    }

    protected createTemplateFile(filename: string, content: string) {
        const filePath = path.join(vscode.workspace.rootPath, ".vscode", filename);
        fs.appendFileSync(filePath, content, {encoding: "utf8"});

        vscode.window.showInformationMessage("Template file "  + filename + " files not found. Now created one for you. Customize and try again.");

        vscode.workspace.openTextDocument(filePath).then((doc) => {
            vscode.window.showTextDocument(doc);
        });

    }

    protected getFilePath() {
        return path.join(vscode.workspace.rootPath, ".vscode", this.doGetFilename());
    }

    protected abstract doGetFilename(): string;

    protected abstract doGetDefaultContent(): string;
}

export default FileTemplateBase;
