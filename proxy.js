const ts = require('./typescript');
const vue = require('./volar/extension/node_modules/@volar/vscode-vue-languageservice');

exports.createProgramProxy = createProgramProxy;

function createProgramProxy(options) {

    const parseConfigHost = {
        useCaseSensitiveFileNames: options.host.useCaseSensitiveFileNames(),
        readDirectory: (path, extensions, exclude, include, depth) => {
            return options.host.readDirectory(path, ['.vue'], exclude, include, depth);
        },
        fileExists: fileName => options.host.fileExists(fileName),
        readFile: fileName => options.host.readFile(fileName),
    };
    const { fileNames: vueFileNames } = ts.parseJsonConfigFileContent({}, parseConfigHost, options.host.getCurrentDirectory(), options.options);

    const fileNames = [
        ...options.rootNames,
        ...vueFileNames,
    ];

    const scriptSnapshots = new Map();
    const vueLsHost = {
        ...options.host,
        writeFile: undefined,
        getCompilationSettings: () => options.options,
        getScriptFileNames: () => fileNames,
        getScriptVersion: () => '',
        getScriptSnapshot,
        getProjectVersion: () => '',
    };
    const vueLs = vue.createLanguageService(vueLsHost, { typescript: ts });
    const program = vueLs.tsProgramProxy; // TODO: use proxy program

    return program;

    function getScriptSnapshot(fileName) {
        const scriptSnapshot = scriptSnapshots.get(fileName);
        if (scriptSnapshot) {
            return scriptSnapshot;
        }
        if (options.host.fileExists(fileName)) {
            const fileContent = options.host.readFile(fileName);
            const scriptSnapshot = ts.ScriptSnapshot.fromString(fileContent);
            scriptSnapshots.set(fileName, scriptSnapshot);
            return scriptSnapshot;
        }
    }
}