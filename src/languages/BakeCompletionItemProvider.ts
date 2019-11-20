import * as vscode from "vscode";

export class BakeCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

        const symbol = context.triggerCharacter;
        if (symbol === ":") {
            return getAttibuteValueCompletionItems(document, position);
        } else if (symbol === ",") {
            return getAttributeCompletionItems(document, position);
        } else if (symbol === "\n") {
            return getCommandCompletionItems(document, position);
        } else {
            return null;
        }
    }
}

function getCommandCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

    if (!RegExp(/^\s*$/).test(document.lineAt(position.line).text)) {
        // current line already contains commands, do not provide completions
        return null;
    }

    // find the parent command, if exist
    // nearest open 'Command ... {'
    let line = position.line - 1;
    const openRegex = new RegExp(/^\s*(\w*).*{\s*/);
    const closeRegex = new RegExp(/^.*}\s*/);
    let result;
    let skipCounter = 0;
    while (line >= 0) {
        const textLine = document.lineAt(line).text;
        if (closeRegex.test(textLine)) {
            skipCounter++;
        }

        result = textLine.match(openRegex);
        if (result && result.length > 1) {
            if (skipCounter === 0) {
                break;
            }
            skipCounter--;
        }

        line--;
    }

    let items = [];
    if (!result || result.length < 2) {
        // no parent, we are in the root
        items = ["Project", "Adapt"];
    } else {
        switch (result[1]) {
            case "Project":
                items = ["Description", "RequiredBakeVersion", "Responsible",
                    "ExecutableConfig", "LibraryConfig", "CustomConfig"];
                break;
            case "Files":
                items = ["Flags", "Define"];
                break;
            case "Prebuild":
                items = ["Except"];
                break;
            case "Makefile":
                items = ["Flags"];
                break;
            case "Toolchain":
                items = ["Compiler", "Archiver", "Linker", "Docu"];
                break;
            case "DefaultToolchain":
                items = ["Compiler", "Archiver", "Linker", "InternalIncludes", "Docu"];
                break;
            case "Archiver":
                items = ["Flags"];
                break;
            case "Linker":
                items = ["Flags", "LibPrefixFlags", "LibPostfixFlags"];
                break;
            case "Compiler":
                items = ["Flags", "Define", "InternalDefines", "SrcFileEndings"];
                break;
            case "PreSteps":
            case "PostSteps":
            case "StartupSteps":
            case "ExitSteps":
            case "CleanSteps":
                items = ["Makefile", "CommandLine", "Sleep", "MakeDir", "Remove", "Touch", "Copy", "Move"];
                break;
            case "ExecutableConfig":
                items = items.concat(["LinkerScript", "MapFile"]);
            case "LibraryConfig":
                items = items.concat(["Files", "ExcludeFiles", "ArtifactName", "ArtifactExtension"]);
            case "CustomConfig":
                items = items.concat(["Description", "IncludeDir", "Set", "Dependency", "ExternalLibrary", "UserLibrary",
                    "ExternalLibrarySearchPath", "PreSteps", "PostSteps", "StartupSteps", "ExitSteps",
                    "CleanSteps", "DefaultToolchain", "Toolchain", "Prebuild"]);
                break;
            default:
                break;
        }
    }

    return Array.from(items, (x) => {
        return { label: x, kind: vscode.CompletionItemKind.Keyword, insertText: x };
    });
}

function getAttributeCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

    const regex = new RegExp(/^\s*(\w*)\s*.*/);
    const textLine = document.lineAt(position).text;
    const result = textLine.match(regex);

    if (!result || result.length < 2) {
        return null;
    }

    let items = [];
    switch (result[1]) {
        case "Project":
            items = ["default"];
            break;
        case "Person":
            items = ["email"];
            break;
        case "RequiredBakeVersion":
            items = ["minimum", "maximum"];
            break;
        case "ExecutableConfig":
        case "LibraryConfig":
        case "CustomConfig":
            items = ["extends", "mergeInc", "private", "strict"];
            break;
        case "IncludeDir":
            items = ["inherit", "inject", "system"];
            break;
        case "Set":
            items = ["value", "cmd", "env"];
            break;
        case "Dependency":
        case "Except":
            items = ["config"];
            break;
        case "ExternalLibrary":
            items = ["search"];
            break;
        case "Makefile":
            items = ["lib", "target", "pathTo", "noClean", "changeWorkingDir", "echo", "independent", "validExitCodes"];
            break;
        case "CommandLine":
            items = ["echo", "independent", "validExitCodes"];
            break;
        case "Sleep":
            items = ["echo", "independent"];
            break;
        case "MakeDir":
        case "Remove":
        case "Touch":
            items = ["echo"];
            break;
        case "Copy":
        case "Move":
            items = ["to", "echo"];
            break;
        case "Flags":
        case "LibPrefixFlags":
        case "LibPostfixFlags":
            items = ["add", "remove"];
            break;
        case "Files":
            items = ["compileOnly"];
            break;
        case "Archiver":
            items = ["command", "prefix"];
            break;
        case "Linker":
            items = ["command", "prefix", "onlyDirectDeps"];
            break;
        case "DefaultToolchain":
            items = ["outputDir", "eclipseOrder"];
            break;
        case "Toolchain":
            items = ["outputDir"];
            break;
        case "Compiler":
            items = ["command", "cuda", "prefix", "keepObjFileEndings"];
            break;
        case "Adapt":
            items = ["toolchain", "os", "mainProject", "mainConfig"];
            break;
        case "Scope":
            items = ["value"];
            break;
        default:
            break;
    }

    return Array.from(items, (x) => {
        return { label: x, kind: vscode.CompletionItemKind.Keyword, insertText: " " + x };
    });
}

function getAttibuteValueCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

    const range = document.getWordRangeAtPosition(position.translate(0, -1));
    const word = document.getText(range);

    let items = [];
    switch (word) {
        case "inject":
            items = ["front", "back"];
            break;
        case "inherit":
        case "system":
        case "env":
        case "seacrh":
        case "noClean":
        case "changeWorkingDir":
        case "independent":
        case "eclipseOrder":
        case "keepObjFileEndings":
        case "onlyDirectDeps":
        case "cuda":
        case "compileOnly":
        case "strict":
            items = ["true", "false"];
            break;
        case "echo":
            items = ["on", "off"];
            break;
        case "type":
            items = ["replace", "remove", "extend", "push_front"];
            break;
        case "project":
            items = ["__MAIN__", "__ALL__", "__THIS__"];
            break;
        default:
            break;
    }

    return Array.from(items, (x) => {
        return { label: x, kind: vscode.CompletionItemKind.Keyword, insertText: " " + x };
    });
}
