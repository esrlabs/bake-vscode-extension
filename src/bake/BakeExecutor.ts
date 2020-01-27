import { promisify } from 'util';
import { exec, execFile } from 'child_process';
import * as path from 'path';

import * as util from '../util';

export interface BakeExecutable {
    path: string;
    isPresent: boolean;
    isServerModeSupported?: boolean;
    version?: util.Version;
    minimalServerModeVersion: util.Version;
}

export async function getBakeExecutableInformation(execPath?: string): Promise<BakeExecutable> {
    let bakePath: string = process.platform === 'win32' ? 'bake.bat' : 'bake';
    if (execPath && execPath.length != 0) {
        bakePath = path.join(execPath, bakePath);
    }

    const bake: BakeExecutable = {
        path: bakePath,
        isPresent: false,
        minimalServerModeVersion: util.parseVersion('2.56.0')
    };

    try {
        const { stdout } = await promisify(exec)(`${bakePath} --version`);
        if (stdout) {
            const versionRe = /-- bake ([\d\.]*), .* --/;
            bake.version = util.parseVersion(versionRe.exec(stdout)![1]);

            bake.isServerModeSupported = util.versionEquals(bake.version, bake.minimalServerModeVersion) ||
                util.versionGreater(bake.version, bake.minimalServerModeVersion);
            bake.isPresent = true;
        }
    } catch {
    }

    return bake;
}

/**
 * Executes bake (must be in PATH) and captures its output
 */
class BakeExecutor {

    private workspaceFolder: string;

    constructor(workspaceFolder: string) {
        this.workspaceFolder = workspaceFolder;
    }

    public execute(args: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec("bake " + args,
                {
                    cwd: this.workspaceFolder,
                    maxBuffer: 1024 * 1024,
                }, (error, stdout: string, stderr: string) => {
                    if (error) {
                        if (stdout.length === 0) {
                            reject(error);
                        } else {
                            reject(stdout);
                        }
                        return;
                    }

                    resolve(stdout);
                });
        });
    }
}

export default BakeExecutor;
