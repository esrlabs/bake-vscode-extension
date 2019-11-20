import { promisify } from 'util'
import { exec, execFile } from 'child_process'

import * as util from '../util'

export interface BakeExecutable {
    path: string;
    isPresent: boolean;
    isServerModeSupported?: boolean;
    version?: util.Version;
    minimalServerModeVersion: util.Version;
}

export async function getBakeExecutableInformation(path: string): Promise<BakeExecutable> {
    const bake: BakeExecutable = {
        path,
        isPresent: false,
        minimalServerModeVersion: util.parseVersion('2.56.0')
    };
    if (path.length != 0) {
        try {
            const { stdout } = await promisify(execFile)(path, ['--version']);
            if (stdout) {
                const versionRe = /-- bake ([\d\.]*), .* --/;
                bake.version = util.parseVersion(versionRe.exec(stdout)![1]);

                bake.isServerModeSupported = util.versionEquals(bake.version, bake.minimalServerModeVersion) ||
                    util.versionGreater(bake.version, bake.minimalServerModeVersion);
                bake.isPresent = true;
            }
        } catch {
        }
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
                }, function callback(error, stdout: string, stderr: string) {
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
