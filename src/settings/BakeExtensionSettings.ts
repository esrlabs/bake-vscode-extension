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

/**
 * Provides access to all bake-extension related settings in
 *   .vscode/settings.json
 */
export class BakeExtensionSettings {

    private config: vscode.WorkspaceConfiguration;
    private path = require("path");

    constructor() {
        this.config = vscode.workspace.getConfiguration("bake");
    }

    public getNumberOfParallelBuilds() {
        return this.config.get("parallelBuildNum");
    }

    public getUnitTestAdaptType(): string {
        return this.config.get<string>("unitTestsAdapt");
    }

    public shallUnitTestRunOnBuild(): boolean {
        return this.config.get<boolean>("runUnitTestsOnBuild");
    }

    public getDefaultProblemMatcher(): string {
        return this.config.get<string>("defaultPromblemMatcher");
    }

    public getDefaultBuildVariant(): string {
        const targets = this.getBuildVariants();
        if (!targets || Object.keys(targets).length === 0) {
            return null;
        }

        let defaultTarget;
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
        const buildVariants: any = this.config.get("buildVariants");
        const copy = {};
        for (const key in buildVariants) {
            if (key === EXAMPLE_VARIANT_NAME &&
                JSON.stringify(buildVariants[key]) === JSON.stringify(EXAMPLE_VARIANT)) {
                continue; // ignore the example
            }

            copy[key] = buildVariants[key];
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

    get useRTextServer(): boolean { return this.config.get("useRTextServer"); }
}

export default BakeExtensionSettings;
