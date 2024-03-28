"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursivelyFindFileNames = exports.validateParameters = exports.validateHierarchy = exports.isLegalParameter = void 0;
const utils_1 = require("@laoban/utils");
const path_1 = __importDefault(require("path"));
const variables_1 = require("@laoban/variables");
const utils_2 = require("./utils");
function isLegalParameter(x) {
    return x.legal !== undefined;
}
exports.isLegalParameter = isLegalParameter;
function toObject(x) {
    if (x === undefined)
        return {};
    if (typeof x === 'object')
        return x;
    return { default: x };
}
function validateHierarchy(hierarchy) {
    if (hierarchy === undefined)
        return [];
    if (typeof hierarchy !== 'object')
        return [`Hierarchy must be an object`];
    return (0, utils_1.flatMap)(Object.entries(hierarchy), ([k, v]) => {
        if (typeof v !== 'string')
            return [`Hierarchy value for '${k}' must be a string`];
        return [];
    });
}
exports.validateHierarchy = validateHierarchy;
function validateParameters(dic, properties) {
    if (properties === undefined)
        return [];
    if (typeof properties !== 'object')
        return [`Parameters must be an object`];
    const notInProperties = Object.keys(dic).filter(k => properties[k] === undefined);
    if (notInProperties.length > 0)
        return [`The parameters ${notInProperties.join(', ')} are not allowed`];
    return (0, utils_1.flatMap)(Object.entries(properties), ([k, v]) => {
        if (dic[k] === undefined)
            return [`The parameter '${k}' is not defined`];
        if (isLegalParameter(v)) {
            if (!Array.isArray(v.legal))
                return [`Legal values for '${k}' must be an array`];
            for (let lv in v.legal)
                if (typeof lv !== 'string')
                    return [`Legal value for '${k}' must be a string`];
            if (!v.legal.includes(dic[k]))
                return [`The value '${dic[k]}' for '${k}' is not legal. Legal values are ${JSON.stringify(v.legal)}`];
        }
        return [];
    });
}
exports.validateParameters = validateParameters;
async function recursivelyFindFileNames(context, root, trail, file, debug) {
    const { fileOps, yaml, dic } = context;
    if (trail.includes(file))
        throw new Error(`Circular reference detected: ${trail.join(' -> ')} -> ${file}`);
    let newFile = path_1.default.join(root, file);
    const newPathForFile = path_1.default.dirname(newFile);
    if (!await fileOps.isFile(newFile))
        return [{ trail, file, exists: false, errors: [], yaml: undefined }];
    const content = await fileOps.loadFileOrUrl(newFile);
    const allParams = (0, utils_2.extractPlaceholders)(content);
    const missingParams = allParams.filter(p => dic[p] === undefined).map(s => '${' + s + '}');
    if (missingParams.length > 0)
        return [{ trail, file, exists: true, errors: [`Illegal parameter(s) ${missingParams.join(', ')}`], yaml: undefined }];
    const derefed = (0, variables_1.derefence)(newFile, dic, content, { variableDefn: variables_1.dollarsBracesVarDefn, allowUndefined: true });
    const yamlContent = yaml.parser(derefed);
    if ((0, utils_1.hasErrors)(yamlContent))
        return [{ trail, file, exists: true, errors: (0, utils_1.toArray)(yamlContent), yaml: undefined }];
    const hierarchy = yamlContent?.hierarchy;
    let parameters = yamlContent?.parameters;
    const errors = [...validateHierarchy(hierarchy), ...validateParameters(dic, parameters)];
    if (errors.length > 0)
        return [{ trail, file, exists: true, errors, yaml: yamlContent }];
    const fromHierarchy = await (0, utils_1.flatMapK)(Object.values(toObject(hierarchy)), f => recursivelyFindFileNames(context, newPathForFile, [...trail, file], f, debug));
    return [{ trail, file, exists: true, errors, yaml: yamlContent }, ...fromHierarchy];
}
exports.recursivelyFindFileNames = recursivelyFindFileNames;
// export async function recursivelyLoad ( context: LoadContext, root: string, trail: string[], file: string ): Promise<FileAndYaml[]> {
//   const { fileOps, fromYaml, dic } = context
//   if ( trail.includes ( file ) ) throw new Error ( `Circular reference detected: ${trail.join ( ' -> ' )} -> ${file}` )
//   let newFile = path.join ( root, file );
//   const newPathForFile = path.dirname ( newFile )
//   const content = await fileOps.loadFileOrUrl ( newFile )
//   const derefed = derefence ( newFile, dic, content, { variableDefn: dollarsBracesVarDefn, throwError: true } )
//   const yaml = fromYaml ( derefed )
//   const hierarchy = toObject<string> ( yaml?.hierarchy )
//   const fromHierarchy = await flatMapK ( Object.values ( hierarchy ), file => recursivelyLoad ( context, newPathForFile, [ ...trail, file ], file ) )
//   return [ { file, yaml }, ...fromHierarchy ]
//
// }
