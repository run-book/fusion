"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommands = exports.addPropertyCommand = exports.findPartInFull = exports.mergeFilesCommand = exports.listFilesCommand = exports.viewConfigCommand = void 0;
const path_1 = __importDefault(require("path"));
const utils_1 = require("@laoban/utils");
const transform_1 = require("./transform");
const merge_1 = require("./merge");
const convert_to_yaml_1 = require("./convert.to.yaml");
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
            '--full': { description: 'Show more data about the files' },
            '--errors': { description: 'Just show errors' }
        },
        action: async (_, opts) => {
            const { params, file, parent } = fromOpts(opts);
            const fileDetails = await (0, transform_1.recursivelyFindFileNames)({ fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true);
            const errors = fileDetails.filter(f => f.errors.length > 0);
            if (opts.errors)
                errors.forEach(f => console.log(f));
            else if (opts.full)
                fileDetails.forEach(({ yaml, ...rest }) => console.log(rest));
            else {
                fileDetails.forEach(f => console.log(f.file));
                if (errors.length > 0) {
                    console.log('Errors:');
                    fileDetails.filter(f => f.errors.length > 0).forEach(f => console.log(f.file, f.errors));
                }
            }
            if (errors.length > 0)
                process.exit(1);
        }
    };
}
exports.listFilesCommand = listFilesCommand;
async function mergeForCli(tc, params, parent, file, opts) {
    const fileDetails = await (0, transform_1.recursivelyFindFileNames)({ fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true);
    const errors = fileDetails.filter(f => f.errors.length > 0);
    const merged = fileDetails.reduce((acc, fd) => (0, merge_1.mergeObjectInto)(acc, fd), { value: undefined, files: [] });
    const { version, parameters, hierarchy, ...rest } = merged.value;
    let sorted = { value: { version, parameters, hierarchy, ...rest }, files: merged.files };
    return { fileDetails, errors, merged, sorted };
}
function mergeFilesCommand(tc) {
    return {
        cmd: 'merge',
        description: 'Produces the composite merged file',
        options: {
            '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
            '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
            '--debug': { description: 'Show debug information' },
            '--full': { description: 'Show more data about the files' }
        },
        action: async (_, opts) => {
            const { params, file, parent } = fromOpts(opts);
            let { fileDetails, errors, merged, sorted } = await mergeForCli(tc, params, parent, file, opts);
            if (errors.length > 0) {
                console.log('Errors:');
                fileDetails.filter(f => f.errors.length > 0).forEach(f => console.log(f.file, f.errors));
                process.exit(1);
            }
            if (opts.full === true)
                console.log(JSON.stringify(merged.value, null, 2));
            else {
                console.log(`# ${JSON.stringify(params)}`);
                console.log("#");
                console.log("# Files");
                fileDetails.filter(f => f.exists).forEach(({ yaml, ...rest }) => console.log(`# ${JSON.stringify(rest)}`));
                console.log("#");
                console.log("# Files not found");
                fileDetails.filter(f => !f.exists).forEach(({ yaml, ...rest }) => console.log(`# ${JSON.stringify(rest)}`));
                console.log("#");
                console.log((0, convert_to_yaml_1.convertToYaml)(sorted, convert_to_yaml_1.defaultCommentFunction));
            }
        }
    };
}
exports.mergeFilesCommand = mergeFilesCommand;
function findPartInFull(dic, ref) {
    if (ref === undefined)
        return undefined;
    if (ref === '')
        return dic;
    const parts = ref.split('.');
    try {
        return parts.reduce((acc, part) => acc?.value?.[(0, utils_1.firstSegment)(part, ':')], dic);
    }
    catch (e) {
        return undefined;
    }
}
exports.findPartInFull = findPartInFull;
function addPropertyCommand(tc) {
    return {
        cmd: 'property <property>',
        description: 'Produces the composite merged file',
        options: {
            '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
            '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
            '--debug': { description: 'Show debug information' },
            '--full': { description: 'Show more data about the files' }
        },
        action: async (_, opts, property) => {
            const { params, file, parent } = fromOpts(opts);
            let { fileDetails, errors, merged, sorted } = await mergeForCli(tc, params, parent, file, opts);
            if (errors.length > 0) {
                console.log('Errors:');
                fileDetails.filter(f => f.errors.length > 0).forEach(f => console.log(f.file, f.errors));
                process.exit(1);
            }
            if (opts.full === true)
                console.log(JSON.stringify(findPartInFull(sorted, property), null, 2));
            else {
                const simplified = tc.context.yaml.parser((0, convert_to_yaml_1.convertToYaml)(sorted, convert_to_yaml_1.defaultCommentFunction));
                let result = (0, utils_1.findPart)(simplified, property);
                if (typeof result === 'object')
                    console.log(JSON.stringify(result, null, 2));
                else
                    console.log(result);
            }
        }
    };
}
exports.addPropertyCommand = addPropertyCommand;
function configCommands(tc) {
    return {
        cmd: 'config',
        description: 'Config commands',
        commands: [
            viewConfigCommand(tc),
            listFilesCommand(tc),
            mergeFilesCommand(tc),
            addPropertyCommand(tc)
        ]
    };
}
exports.configCommands = configCommands;
