import * as util from "util";
import * as vscode from "vscode";
import { BuildVariant } from "../model/BuildVariant";
import { createLogger } from "../util/logger";

const log = createLogger();

const EXAMPLE_VARIANT = {
    project: "Spaceship3",
    config: "arm-x64",
    adapt: "host,unittest",
    default: "true",
};

const EXAMPLE_VARIANT_NAME = "ExampleVariant"; // need to ignore that one

export interface ExtensionSettings {
    useRTextServer: boolean;
    unitTestsAdapt: string;
    parallelBuildNum: number;
    runUnitTestsOnBuild: boolean;
    defaultProblemMatcher: string;
    buildVariants: object;
}

/**
 * Provides access to all bake-extension related settings in
 *   .vscode/settings.json
 */
export class BakeExtensionSettings {
    private _configData: ExtensionSettings;

    constructor(folder?: vscode.WorkspaceFolder) {
        this._configData = <ExtensionSettings><any>vscode.workspace.getConfiguration("bake", folder?.uri);
    }

    get parallelBuildNum(): number { return this.configData.parallelBuildNum; }

    get unitTestsAdapt(): string { return this.configData.unitTestsAdapt; }

    get runUnitTestsOnBuild(): boolean { return this.configData.runUnitTestsOnBuild; }

    get defaultProblemMatcher(): string { return this.configData.defaultProblemMatcher; }

    get buildVariants(): object { return this.configData.buildVariants; }

    public getDefaultBuildVariant(): string {
        const targets = this.getBuildVariants();
        for (const name in targets) {
            const target = targets[name];
            if (target && target.default !== undefined &&
                target.default === "true") {
                return name;
            }
        }
        return null;
    }

    public getBuildVariants(): object {
        const copy = {};
        for (const key in this.buildVariants) {
            if (key === EXAMPLE_VARIANT_NAME &&
                JSON.stringify(this.buildVariants[key]) === JSON.stringify(EXAMPLE_VARIANT)) {
                continue; // ignore the example
            }
            copy[key] = this.buildVariants[key];
        }
        return copy;
    }

    public areBuildVariantsDefined(): boolean {
        return Object.keys(this.getBuildVariants()).length > 0;
    }

    public getNumberOfBuildVariants(): number {
        return Object.keys(this.getBuildVariants()).length;
    }

    public getBuildVariant(name: string): object {
        const found = this.getBuildVariants()[name];
        if (!found) {
            log.error(`Build variant ${name} is not defined in settings`);
        }
        return found;
    }

    public resolveImportsOfBuildVariant(buildVariant): BuildVariant[] {
        log.info(`Resolving imports of ${util.inspect(buildVariant)}`);
        if (!buildVariant.importFrom) {
            log.info(`No imports found, continuing with ${buildVariant.project} ${buildVariant.config} ${buildVariant.adapt}`);
            return [buildVariant];
        }

        return buildVariant.importFrom.reduce((buildVariants, name) => {
            log.info(`Resolving variants of import ${name}`);
            const importedVariants = this.resolveImportsOfBuildVariant(this.getBuildVariant(name));
            buildVariants.push(...importedVariants);
            return buildVariants;
        }, buildVariant.project ? [buildVariant] : []);
    }

    get configData(): ExtensionSettings { return this._configData; }

    get useRTextServer(): boolean { return this.configData.useRTextServer; }
}

export default BakeExtensionSettings;
