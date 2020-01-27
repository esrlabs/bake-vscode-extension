import * as vscode from "vscode";

export enum LogLevel {
    Info,
    Warning,
    Error,
}

export interface Stringable {
    toString(): string;
    toLocaleString(): string;
}

/**
 * Pipes output to the debug console (host VSCode) AND
 * to the output window (to be able to see messages in the
 * productive env).
 */
export class Logger {

    private _channel: vscode.OutputChannel;

    constructor() {
        this._channel = vscode.window.createOutputChannel('Bake');
    }

    public info(...args: Stringable[]) { this.log(LogLevel.Info, ...args); }
    public warning(...args: Stringable[]) { this.log(LogLevel.Warning, ...args); }
    public error(...args: Stringable[]) { this.log(LogLevel.Error, ...args); }

    private log(level: LogLevel, ...args: Stringable[]) {
        const message = args.map(a => a.toString()).join(' ');
        switch (level) {
        case LogLevel.Info:
            console.info('[Bake]', message);
            break;
        case LogLevel.Warning:
            console.warn('[Bake]', message);
            break;
        case LogLevel.Error:
            console.error('[Bake]', message);
            break;
        }

        this._channel.appendLine(message);
    }

    private static _inst: Logger|null = null;

    static instance(): Logger {
        if (Logger._inst === null) {
            Logger._inst = new Logger();
        }
        return Logger._inst;
    }
}

export function createLogger() { return Logger.instance(); }
