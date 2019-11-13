import * as vscode from "vscode";
import { stringify } from "querystring";

export class BakeDocumentFormatter implements vscode.DocumentFormattingEditProvider {
    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        const result: vscode.TextEdit[] = [];
        // Creates range from begin to the end of the document
        const range = new vscode.Range(0, 0, document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length);
        const content = document.getText(range);
        let formatted = formatText(content, options);
        if (formatted) {
            result.push(new vscode.TextEdit(range, formatted));
        }
        return result;
    }
}

function formatText(content: string, options: vscode.FormattingOptions): string {
    const lines = content.split('\n');
    const openRegex = new RegExp(/^\s*(\w*).*{\s*/);
    const closeRegex = new RegExp(/^.*}\s*/);
    let beginGroup = [];
    let endGroup = -1;

    const indent = options.insertSpaces ?
        " ".repeat(options.tabSize) : "\t";

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
