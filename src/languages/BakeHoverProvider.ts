import * as vscode from "vscode";

export class BakeHoverProvider implements vscode.HoverProvider {
    static BakeType: string = 'bake';

    private commands;

    constructor(ctx: vscode.ExtensionContext) {
        this.commands = require(ctx.asAbsolutePath("data/commands.json"));
    }

    public provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken) {

        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        let found = this.commands.find((element, _index, _array) => element.key == word);

        if (found == undefined)
            return null;

        let hoverText: string = ddrivetip(found.key, found.mandatory,
            found.quantity, found.default, found.description);

        return new vscode.Hover(hoverText);
    }
}

function ddrivetip(item: string, manda: string, quan: string, def: string, desc: string) {
    const mdTemplate =
`_${item}_  

__Mandatory:__ ${manda}  
__Quantity:__ ${quan}  
__Default:__ ${def}  

__Description:__  
${desc}`;

    return mdTemplate;
}
