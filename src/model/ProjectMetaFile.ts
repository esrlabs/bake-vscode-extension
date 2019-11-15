import * as vscode from "vscode";
import logger from "../util/logger";

/**
 * Represents a Project.meta file in a BakeWorkspace
 */
export class ProjectMetaFile {

    private path = require("path");
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath.replace(/\\/g, "/");
    }

    public getName(): string {
        const directoryPath = this.getFolderPath();
        return this.path.basename(directoryPath);
    }

    public getFilePath(): string {
        return this.filePath;
    }

    public getFolderPath(): string {
        return this.path.dirname(this.filePath).replace(/\\/g, "/");
    }

    public getDefaultTarget(): Thenable<string> {
        return vscode.workspace.openTextDocument(this.filePath)
            .then((document) => {
                const re = /^[^#A-Za-z0-9]*(?:Project default:)\s+(\w*)/;
                let res: string;
                for (let l = 0; l < document.lineCount; ++l) {
                    const line = document.lineAt(l);
                    const match = line.text.match(re);
                    if (match) {
                        res = match[1];
                        break;
                    }
                }
                return res
            }).then(null, (e) => {
                logger.error(e.toString());
                return "";
            });
    }

    public getWorkspaceFolder(): vscode.WorkspaceFolder {
        const normalizedProjectPath = this.path.normalize(this.getFolderPath());
        for (const folder of vscode.workspace.workspaceFolders) {
            const normalizedWorkspace = this.path.normalize(folder.uri.fsPath);
            if (normalizedProjectPath.indexOf(normalizedWorkspace) === 0) {
                return folder;
            }
        }
        return null;
    }

    public getPathInWorkspace(): string {
        const folder = this.getWorkspaceFolder();
        const relativePath = this.path.relative(folder.uri.fsPath, this.getFolderPath());
        // Convert to slashes...
        return relativePath.replace(/\\/g, "/");
    }

    public getTargets(): Thenable<string[]> {
        const directory = this.getFolderPath();
        return vscode.workspace.openTextDocument(this.filePath)
            .then((document) => {
                // Match all targets except those commented out
                const re = /^[^#A-Za-z0-9]*(?:ExecutableConfig|LibraryConfig|CustomConfig)\s+(\w*)/;
                const matches = [];
                for (let l = 0; l < document.lineCount; ++l) {
                    const line = document.lineAt(l);
                    const match = line.text.match(re);
                    if (match) {
                        matches.push(match[1]);
                    }
                }
                return matches
            }).then(null, (e) => {
                logger.error(e.toString());
                return [];
            });
    }
}

export default ProjectMetaFile;
