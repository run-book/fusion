"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thereAndBackContext = void 0;
const cli_1 = require("@itsmworkbench/cli");
function thereAndBackContext(name, version, fileOps, yaml) {
    return { ...(0, cli_1.cliContext)(name, version, fileOps), yaml };
}
exports.thereAndBackContext = thereAndBackContext;
