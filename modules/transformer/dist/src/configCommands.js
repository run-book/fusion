"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommands = exports.listFilesCommand = exports.viewConfigCommand = void 0;
const path_1 = __importDefault(require("path"));
const transform_1 = require("./transform");
function parseParams(params) {
    if (typeof params === 'string') {
        const pairs = params.split(',');
        return pairs.reduce((acc, pair) => {
            const [key, value] = pair.split('=');
            acc[key] = value;
            return acc;
        }, {});
    }
    return {};
}
function fromOpts(opts) {
    const params = parseParams(opts.params);
    const file = opts.file;
    const parent = path_1.default.dirname(file);
    return { params, file: path_1.default.basename(file), parent };
}
function viewConfigCommand(tc) {
    return {
        cmd: 'view',
        description: 'View the current configuration',
        options: {
            '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
            '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' }
        },
        action: async (_, opts) => {
            const { params, file, parent } = fromOpts(opts);
            console.log("Options: ", params, parent, file);
        }
    };
}
exports.viewConfigCommand = viewConfigCommand;
function listFilesCommand(tc) {
    return {
        cmd: 'list',
        description: 'List the files that are loaded',
        options: {
            '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
            '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
            '--debug': { description: 'Show debug information' },
            '--errors': { description: 'Just show errors' }
        },
        action: async (_, opts) => {
            const { params, file, parent } = fromOpts(opts);
            const fileDetails = await (0, transform_1.recursivelyFindFileNames)({ fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true);
            const errors = fileDetails.filter(f => f.errors.length > 0);
            if (opts.errors)
                errors.forEach(f => console.log(f));
            else
                fileDetails.forEach(f => console.log(f));
            if (errors.length > 0)
                process.exit(1);
        }
    };
}
exports.listFilesCommand = listFilesCommand;
function configCommands(tc) {
    return {
        cmd: 'config',
        description: 'Config commands',
        commands: [
            viewConfigCommand(tc),
            listFilesCommand(tc)
        ]
    };
}
exports.configCommands = configCommands;
