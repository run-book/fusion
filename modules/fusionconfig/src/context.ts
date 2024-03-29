import { cliContext, CliContext, CliTc, fixedConfig } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";
import { LoadFilesContext } from "@fusionconfig/loadfiles";
import { fileOpsNode } from "@laoban/filesops-node";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { findVersion, NoConfig } from "../index";

export type HasYaml = {
  yaml: YamlCapability
}
export interface ThereAndBackContext extends CliContext, HasYaml {}

export function context ( version: string ): ThereAndBackContext {return thereAndBackContext ( 'intellimaintain', version, fileOpsNode (), jsYaml () )}
export const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
export const configFinder = fixedConfig<NoConfig> ( context )

export function thereAndBackContext ( name: string, version: string, fileOps: FileOps, yaml: YamlCapability ): ThereAndBackContext {
  return { ...cliContext ( name, version, fileOps ), yaml }
}