"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient";
import * as path from "path";

import newCppFile from "./commands/newCppFile";
import newHeaderFile from "./commands/newHeaderFile";
import { cleanIncludesAndDefines } from "./commands/cleanIncludesAndDefines";
import { doImportBuildVariantFromSettings, importIncludesAndDefines } from "./commands/importIncludesAndDefines";
import { BakeTaskProvider } from "./tasks/BakeTaskProvider";
import { registerActiveBakeTasks } from "./tasks/VariantBuildTasks";
import { BakeHoverProvider } from "./languages/BakeHoverProvider";
import { BakeCompletionItemProvider } from "./languages/BakeCompletionItemProvider";
import { BakeDocumentFormatter } from "./languages/BakeDocumentFormatter";
import { BakeExtensionSettings } from "./settings/BakeExtensionSettings";
import { getBakeExecutableInformation } from "./bake/BakeExecutor";
import { createLogger } from "./util/logger";
import * as util from "./util";

const log = createLogger();

let clients: Map<string, LanguageClient> = new Map();
let serverModule: string;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(cntxt: vscode.ExtensionContext) {
    log.info("Project.meta file(s) detected. Activating bake extension.");

    // These commands have been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    registerCommand(cntxt, "bake.createNewHeaderFile", (context) => {
        newHeaderFile(context);
    });

    registerCommand(cntxt, "bake.createNewCppFile", (context) => {
        newCppFile(context);
    });

    registerCommand(cntxt, "bake.importIncludesAndDefines", (context) => {
        importIncludesAndDefines(context);
    });

    registerCommand(cntxt, "bake.cleanIncludesAndDefines", (context) => {
        cleanIncludesAndDefines(context);
    });

    let workspaceRoot = vscode.workspace.rootPath;
    const BAKE_TYPE = "bake";

    cntxt.subscriptions.push(registerActiveBakeTasks(cntxt));
    cntxt.subscriptions.push(
        vscode.workspace.registerTaskProvider(
            BAKE_TYPE, new BakeTaskProvider(workspaceRoot)));
    cntxt.subscriptions.push(
        vscode.languages.registerHoverProvider(
            BAKE_TYPE, new BakeHoverProvider(cntxt)));
    cntxt.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            BAKE_TYPE, new BakeCompletionItemProvider(), ':', ',', '\n'));
    cntxt.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            BAKE_TYPE, new BakeDocumentFormatter()));

    try {
        importDefaultBuildVariant();
    }
    catch {
        // @todo this command raise an exception if workspace has invalid Project.meta
    }


    // The server is implemented in node
    serverModule = cntxt.asAbsolutePath(path.join("src", "server", "out", "server.js"));

    function didAddedWorkspaceFolder(folder: vscode.WorkspaceFolder) {
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);
        if (!clients.has(folder.uri.toString())) {
            newWorkspaceFolderAdded(folder);
        }
    }

    for (let folder of vscode.workspace.workspaceFolders) {
        didAddedWorkspaceFolder(folder);
    }
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        for (let folder of event.removed) {
            let client = clients.get(folder.uri.toString());
            if (client) {
                clients.delete(folder.uri.toString());
                client.stop();
            }
        }
        for (let folder of event.added) {
            didAddedWorkspaceFolder(folder);
        }
    });
}

export function deactivate(): Thenable<void> {
    let promises: Thenable<void>[] = [];
    for (let client of clients.values()) {
        promises.push(client.stop());
    }
    return Promise.all(promises).then(() => undefined);
}

function sortedWorkspaceFolders(): string[] {
    return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.map(folder => {
        let result = folder.uri.toString();
        if (result.charAt(result.length - 1) !== '/') {
            result = result + '/';
        }
        return result;
    }).sort(
        (a, b) => {
            return a.length - b.length;
        }
    ) : [];
}

function getOuterMostWorkspaceFolder(folder: vscode.WorkspaceFolder): vscode.WorkspaceFolder {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element))!;
        }
    }
    return folder;
}

async function newWorkspaceFolderAdded(folder: vscode.WorkspaceFolder): Promise<void> {
    const bakeSettings = new BakeExtensionSettings();

    const bake = await getBakeExecutableInformation('bake');

    if (bakeSettings.useRTextServer) {
        if (bake.isServerModeSupported) {
            // The debug options for the server
            // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
            const debugOptions = { execArgv: ["--nolazy", `--inspect-brk=${6009 + clients.size}`] };

            // If the extension is launched in debug mode then the debug server options are used
            // Otherwise the run options are used
            const serverOptions: ServerOptions = {
                debug: {
                    module: serverModule,
                    options: debugOptions,
                    transport: TransportKind.ipc,
                },
                run: { module: serverModule, transport: TransportKind.ipc },
            };

            // Options to control the language client
            const clientOptions: LanguageClientOptions = {
                // Register the server for bake project files
                documentSelector: [{ scheme: "file", language: "bake", pattern: "${folder.uri.fsPath}/**/{Project,Adapt}.meta" }],
                synchronize: {
                    // Notify the server about file changes to Project.meta files contained in the workspace
                    fileEvents: vscode.workspace.createFileSystemWatcher("**/{Project,Adapt}.meta"),
                },
                workspaceFolder: folder
            };

            // Create the language client and start the client.
            let client = new LanguageClient(
                "bakeServer",
                "Bake Language Server",
                serverOptions,
                clientOptions,
            );

            // Start the client. This will also launch the server
            client.start();
            clients.set(folder.uri.toString(), client);
        }
        else {
            const minVersion = util.versionToString(bake.minimalServerModeVersion);
            log.warning(
                `Bake RText Service is not available with the current Bake executable. Please upgrade to Bake ${minVersion} or newer.`);
        }
    }
}

function registerCommand(context: vscode.ExtensionContext, id: string, callback: (...args: any[]) => any, thisArg?: any) {
    log.info("Registering command " + id);
    const disposable = vscode.commands.registerCommand(id, callback);
    context.subscriptions.push(disposable);
}

async function importDefaultBuildVariant() {
    const settings = new BakeExtensionSettings();
    const name = settings.getDefaultBuildVariant();
    if (name) {
        log.info(`Found default build variant ${name} in settings.json - auto importing it`);

        await doImportBuildVariantFromSettings(name, settings.getBuildVariant(name));
    }
    vscode.window.setStatusBarMessage(`Auto imported C++ Includes and Defines from Bake done`, 5000);
}
