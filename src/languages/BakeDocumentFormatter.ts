import * as vscode from "vscode";
import { sync as commandExistsSync } from "command-exists"

export class BakeDocumentFormatter implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        const result: vscode.TextEdit[] = [];
        // Creates range from begin to the end of the document
        const range = new vscode.Range(0, 0, document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length);
        let formatted: string;

        const indent = options.insertSpaces ?
            " ".repeat(options.tabSize) : "\t";

        if (commandExistsSync('bake-format')) {
            formatted = bakeFormatText(document.fileName, indent);
        }
        else {
            const content = document.getText(range);
            formatted = formatText(content, indent);
        }

        if (formatted) {
            result.push(new vscode.TextEdit(range, formatted));
        }
        return result;
    }
}

function bakeFormatText(filename: string, indent: string): string | null {
    const { execSync } = require('child_process');
    const command = `bake-format --indent=\"${indent}\" ${filename} -`
    try {
        return execSync(command);
    } catch (error) {
        return null;
    }
}

function formatText(content: string, indent: string): string {
    const lines = content.split('\n');
    const openRegex = new RegExp(/^\s*(\w*).*{\s*/);
    const closeRegex = new RegExp(/^.*}\s*/);
    let beginGroup = [];
    let endGroup = -1;

    lines.forEach((line: string, index: number) => {
        lines[index] = line.trim();

        if (openRegex.test(line)) {
            beginGroup.push(index);
        }

        if (closeRegex.test(line) && beginGroup.length > 0) {
            endGroup = index
        }

        // Format group
        if (endGroup != -1 && beginGroup.length > 0) {
            let lastBeginGroup = beginGroup[beginGroup.length - 1] + 1;

            while (lastBeginGroup < endGroup) {
                if (lines[lastBeginGroup].length > 0) {
                    lines[lastBeginGroup] = indent + lines[lastBeginGroup];
                }
                lastBeginGroup++;
            }

            beginGroup.pop();
            endGroup = -1;
        }
    });

    // remove empty lines at the end of the document
    while ((lines[lines.length - 1].length == 0) &&
           (lines.length > 1)) {
        lines.pop();
    }

    return lines.join("\n").concat("\n");
}
