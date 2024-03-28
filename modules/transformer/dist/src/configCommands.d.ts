import { CommandDetails, ContextConfigAndCommander, SubCommandDetails } from "@itsmworkbench/cli";
import { ThereAndBackContext } from "./context";
export declare function viewConfigCommand<Commander, Config, CleanConfig>(tc: ContextConfigAndCommander<Commander, any, Config, CleanConfig>): CommandDetails<Commander>;
export declare function listFilesCommand<Commander, Config, CleanConfig>(tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig>): CommandDetails<Commander>;
export declare function configCommands<Commander, Config, CleanConfig>(tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig>): SubCommandDetails<Commander, Config, ThereAndBackContext>;
