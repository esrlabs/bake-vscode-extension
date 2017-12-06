
import * as path from 'path';
import * as fs from 'fs';
import * as jsonfile from 'jsonfile';

const CPP_CONFIG_FILENAME = 'c_cpp_properties.json';
const WORKSPACE_SETTINGS_FOLDER = '.vscode';

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

    exists(): boolean {
        return fs.existsSync(this._cppConfigFile);
    }

    read() {
        return jsonfile.readFileSync(this._cppConfigFile);
    }

    write(config: object) {
        jsonfile.writeFileSync(this._cppConfigFile
            , config
            , { spaces: 2, EOL: '\n' }
        );
    }


}

export default CppConfigFile;