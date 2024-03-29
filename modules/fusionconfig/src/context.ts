import { cliContext, CliContext, CliTc, fixedConfig } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";
import { fileOpsNode } from "@laoban/filesops-node";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { NoConfig } from "../index";
import { LoadFilesFn } from "@fusionconfig/config";
import { findConfigUsingFileops } from "@fusionconfig/fileopsconfig";

export type HasYaml = {
  yaml: YamlCapability
}
export interface ThereAndBackContext extends CliContext, HasYaml {
  loadFiles: LoadFilesFn
}

export function makeContext ( version: string ): ThereAndBackContext {
  return thereAndBackContext ( 'intellimaintain', version, fileOpsNode (), jsYaml () )
}
export const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
export const configFinder = fixedConfig<NoConfig> ( makeContext )

export function thereAndBackContext ( name: string, version: string, fileOps: FileOps, yaml: YamlCapability ): ThereAndBackContext {
  return { ...cliContext ( name, version, fileOps ), yaml, loadFiles: findConfigUsingFileops ( fileOps, yaml ) }
}