'use strict';

import * as vscode from 'vscode';

const NAME = 'bake';

/**
 * Pipes output to the debug console (host VS Code) AND
 * to the output window (to be able to see messages in the 
 * productive env).
 */
class Logger{

    readonly _channel : vscode.OutputChannel;

    constructor(name){
        this._channel = vscode.window.createOutputChannel(name);
    }

    info(output){
        this._channel.append(output);
        console.log(output);
    }

    error(output){
        this._channel.append(output);        
        console.error(output);
    }
}

export default new Logger(NAME);