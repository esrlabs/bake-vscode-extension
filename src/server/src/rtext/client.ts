import * as net from "net";
import * as child_process from "child_process";
import * as path from "path";
import { clearInterval } from "timers";

import * as rtextProtocol from "./protocol";
import { Context } from "./context";

class PendingRequest {
    public invocationId: number = 0;
    public command: string = "";
    public progressCallback?: Function;
    public resolveFunc: Function = () => { };
}

class RTextService {
    process?: child_process.ChildProcess;
    port?: number;
}

export class Client {

    private _client = new net.Socket();
    private _invocationCounter = 0;
    private _connected = false;
    private _pendingRequests: PendingRequest[] = [];
    private _reconnectTimeout?: NodeJS.Timeout;
    private _keepAliveTask?: NodeJS.Timeout;
    private _rtextService?: RTextService;

    public async start(fsPath: string): Promise<any> {
        return this.runBakeRTextService([path.join(fsPath, '**')]).then(service => {
            this._rtextService = service;
            service.process!.on('close', () => {
                this._rtextService = undefined;
            });

            this._client.on("data", (data) => this.onData(data));
            this._client.on("close", () => this.onClose());
            this._client.on("error", (error) => this.onError(error));
            this._client.connect(service.port!, "127.0.0.1", () => this.onConnect());

            this._keepAliveTask = setInterval(() => {
                this.getVersion().then((response) => { console.log("Keep alive, got version " + response.version); });
            }, 60 * 1000);
        });
    }

    public getContextInformation(context: Context): Promise<rtextProtocol.ContextInformationResponse> {
        return this.send({ command: "context_info", context: context.lines, column: context.pos });
    }

    public stop() {
        if (this._reconnectTimeout)
            clearTimeout(this._reconnectTimeout);
        this.stopService();
        if (this._rtextService) {
            this._rtextService.process!.kill();
        }
        if (this._keepAliveTask) {
            clearInterval(this._keepAliveTask);
        }
    }

    public loadModel(progressCallback?: Function): Promise<rtextProtocol.LoadModelResponse> {
        return this.send({ command: "load_model" }, progressCallback);
    }

    public stopService() {
        this.send({ command: "stop" });
    }

    public getVersion(): Promise<rtextProtocol.VersionResponse> {
        return this.send({ command: "version" });
    }

    public send(data: any, progressCallback?: Function | undefined): Promise<any> {
        data.type = "request";
        data.version = 1;
        data.invocation_id = this._invocationCounter;

        const request = new PendingRequest();
        request.invocationId = this._invocationCounter;
        request.progressCallback = progressCallback;
        request.command = data.command;
        this._pendingRequests.push(request);

        const json = JSON.stringify(data);
        const payload = json.length + json;

        this._client.write(payload);
        this._invocationCounter++;

        return new Promise<any>((resolve, reject) => {
            request.resolveFunc = resolve;
        });
    }

    private onError(error: Error) {
        console.log("Connection error: " + error.message);
    }

    private onConnect() {
        this._connected = true;
        console.log("Connected");
        this.loadModel();
    }

    private onClose() {
        this._connected = false;
        console.log("Connection closed");

        this._reconnectTimeout = setTimeout(() => {
            this._client.connect(this._rtextService?.port!, "127.0.0.1", () => this.onConnect());
        }, 1000);
    }

    private onData(data: any) {
        const str = data.toString("utf-8");
        console.log("Received: " + str);
        const m = str.match(/^(\d+)\{/);
        if (m) {
            const lengthLength = m[1].length;
            const length = Number(m[1]);
            if (str.length >= lengthLength + length) {
                const json = str.slice(lengthLength, lengthLength + length);
                const obj = JSON.parse(json);

                const found = this._pendingRequests.findIndex((request) => {
                    return request.invocationId === obj.invocation_id;
                });

                if (found !== -1) {
                    const pending = this._pendingRequests[found];
                    if (obj.type === "response") {
                        if (pending.command === "load_model" ||
                            pending.command === "version" ||
                            pending.command === "context_info") {
                            pending.resolveFunc(obj);
                        }
                        this._pendingRequests.splice(found, 1);
                    } else if (obj.type === "progress" &&
                        pending.progressCallback) {
                        pending.progressCallback!(obj);
                    } else if (obj.type === "unknown_command_error") {
                        console.log("Error: unknown command - " + obj.command);
                        this._pendingRequests.splice(found, 1);
                    } else if (obj.type === "unsupported_version") {
                        console.log("Error: unsupported version " + obj.version);
                        this._pendingRequests.splice(found, 1);
                    }
                }
            }
        }
    }

    private async runBakeRTextService(patterns: [string]): Promise<RTextService> {
        return new Promise<RTextService>((resolve, reject) => {
            const command = `bake-rtext-service ${patterns.join(" ")}`;
            console.log(`Run ${command}`);
            let service = child_process.spawn(`bake-rtext-service`, patterns, { shell: process.platform === 'win32' });

            if (service != null) {
                service.stdout.on('data', (data: any) => {
                    const stdout: string = data.toString();
                    console.log(stdout);
                    const foundPort = stdout.match(/.*listening on port (\d*)/);
                    if (foundPort) {
                        resolve({ process: service, port: parseInt(foundPort[1]) });
                    }
                });
            } else {
                reject(new Error("Run command failed: " + command));
            }
        });
    }
}
