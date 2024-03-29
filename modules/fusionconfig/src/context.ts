import { cliContext, CliContext } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";

export type HasYaml = {
  yaml: YamlCapability
}
export type ThereAndBackContext = CliContext & HasYaml

export function thereAndBackContext ( name: string, version: string, fileOps: FileOps, yaml: YamlCapability ): ThereAndBackContext {
  return { ...cliContext ( name, version, fileOps ), yaml }
}