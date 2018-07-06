
import * as fs from "fs";
import * as jsonfile from "jsonfile";
import * as path from "path";
import logger from "../util/logger";

const CPP_CONFIG_FILENAME = "c_cpp_properties.json";
const WORKSPACE_SETTINGS_FOLDER = ".vscode";
const WORKSPACE_INCLUDE_PREFIX = "${workspaceRoot}";

/**
 * Offers access to .vscode/c_cpp_properties.json
 */
class CppConfigFile {

    private _cppConfigFile;

    constructor(workspaceFolder) {
        this._cppConfigFile = path.join(workspaceFolder
            , WORKSPACE_SETTINGS_FOLDER
            , CPP_CONFIG_FILENAME);
    }

    public exists(): boolean {
        return fs.existsSync(this._cppConfigFile);
    }

    public cleanImportsAndDefines() {
        const cppConfig = this.read();

        cppConfig.configurations.forEach((element) => {
            try {
                // keep the system includes
                element.includePath = element.includePath.filter((include) => !include.startsWith(WORKSPACE_INCLUDE_PREFIX));
                element.defines = [];
            } catch (error) {
                logger.error(error);
            }
        });

        this.write(cppConfig);
    }

    public addImportsAndDefines(collectedIncludes: string[], collectedDefines: string[]) {
        const cppConfig = this.read();

        cppConfig.configurations.forEach((element) => {
            try {
                // Set Includes
                const newIncludePaths: Set<string> = new Set<string>(element.includePath);
                // Make sure workspace paths all have same format
                collectedIncludes = collectedIncludes.map((p) => p.replace(/\\/g, "/"));
                collectedIncludes.forEach( (e) => newIncludePaths.add(e) );
                element.includePath = Array.from(newIncludePaths);

                // Set Defines
                const newDefines: Set<string> = new Set([...element.defines]);
                collectedDefines.forEach((element) => {
                    newDefines.add(element);
                });
                element.defines = Array.from(newDefines);

            } catch (error) {
                logger.error(error);
            }
        });

        this.write(cppConfig);
    }

    private read() {
        return jsonfile.readFileSync(this._cppConfigFile);
    }

    private write(config: object) {
        jsonfile.writeFileSync(this._cppConfigFile
            , config
            , { spaces: 2, EOL: "\n" },
        );
    }

}

export default CppConfigFile;
