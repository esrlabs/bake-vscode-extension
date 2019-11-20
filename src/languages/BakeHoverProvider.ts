import * as minimatch from "minimatch";
import * as vscode from "vscode";

export class BakeHoverProvider implements vscode.HoverProvider {

    private commands;

    constructor(ctx: vscode.ExtensionContext) {
        this.commands = require(ctx.asAbsolutePath("data/commands.json"));
    }

    public provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken) {

        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        const positionCtx = getPositionContext(document, position).join(".");

        const found = this.commands.find((element, _index, _array) => {
            return (element.key == word && minimatch(positionCtx, element.contextGlobPattern));
        });

        if (found == undefined) {
            return null;
        }

        const hoverText: string = ddrivetip(found.key, found.mandatory,
            found.quantity, found.default, found.description);

        return new vscode.Hover(hoverText);
    }
}

function getPositionContext(document: vscode.TextDocument, position: vscode.Position) {

    let line = position.line;
    const openRegex = new RegExp(/^\s*(\w*).*{\s*/);
    const closeRegex = new RegExp(/^.*}\s*/);
    let skipCounter = 0;
    const context = [];

    while (line >= 0) {
        const textLine = document.lineAt(line).text;
        if (closeRegex.test(textLine)) {
            skipCounter++;
        }

        const result = textLine.match(openRegex);
        if (result && result.length > 1) {
            if (skipCounter == 0) {
                context.unshift(result[1]);
            } else {
                skipCounter--;
            }
        }

        line--;
    }

    return context;
}

function ddrivetip(item: string, manda: string, quan: string, def: string, desc: string) {
    const mdTemplate =
`[${item}](https://esrlabs.github.io/bake/syntax/project_meta_syntax.html)

__Mandatory:__ ${manda}
__Quantity:__ ${quan}
__Default:__ ${def}

__Description:__
${desc}`;

    return mdTemplate;
}
