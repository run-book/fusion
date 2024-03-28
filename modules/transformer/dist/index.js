"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findVersion = void 0;
const cli_1 = require("@itsmworkbench/cli");
const filesops_node_1 = require("@laoban/filesops-node");
const commander12_1 = require("@itsmworkbench/commander12");
const jsyaml_1 = require("@itsmworkbench/jsyaml");
const utils_1 = require("@laoban/utils");
const configCommands_1 = require("./src/configCommands");
const context_1 = require("./src/context");
function findVersion() {
    let packageJsonFileName = "../package.json";
    try {
        return require(packageJsonFileName).version;
    }
    catch (e) {
        return "version not known";
    }
}
exports.findVersion = findVersion;
const context = (0, context_1.thereAndBackContext)('intellimaintain', findVersion(), (0, filesops_node_1.fileOpsNode)(), (0, jsyaml_1.jsYaml)());
const cliTc = (0, commander12_1.commander12Tc)();
const configFinder = (0, cli_1.fixedConfig)(context);
const yaml = (0, jsyaml_1.jsYaml)();
(0, cli_1.makeCli)(context, configFinder, cliTc).then(async (commander) => {
    if ((0, utils_1.hasErrors)(commander)) {
        (0, utils_1.reportErrors)(commander);
        process.exit(1);
    }
    cliTc.addSubCommand(commander, (0, configCommands_1.configCommands)(commander));
    // cliTc.addCommands ( commander, [ apiCommand ( yaml ) ] )
    return await cliTc.execute(commander.commander, context.args);
});
