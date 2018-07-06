"use strict";

import * as vscode from "vscode";

const NAME = "bake";

/**
 * Pipes output to the debug console (host VSCode) AND
 * to the output window (to be able to see messages in the
 * productive env).
 */
class Logger {

    public readonly channel: vscode.OutputChannel;

    constructor(name) {
        this.channel = vscode.window.createOutputChannel(name);
    }

    public info(output) {
        this.channel.append(output + "\n");
//        this._channel.show(true);
        console.log(output);
    }

    public error(output) {
        this.channel.append(output + "\n");
        this.channel.show(true);
        console.error(output);
    }
}

export default new Logger(NAME);
