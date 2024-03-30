import { cliContext, CliContext, CliTc, fixedConfig } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";
import { fileOpsNode } from "@laoban/filesops-node";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { UrlStore } from "@itsmworkbench/urlstore";
import { NoConfig } from "../index";
import { addTaskDetails, LoadFilesFn } from "@fusionconfig/config";
import { findConfigUsingFileops } from "@fusionconfig/fileopsconfig";
import { addKafkaSchemasToServices, defaultKafkaNameFn, defaultSchemaNameFn, PostProcessor, SchemaNameFn } from "@fusionconfig/config";
import { nodeUrlstore } from "@itsmworkbench/nodeurlstore";
import { shellGitsops } from "@itsmworkbench/shellgit";
import { defaultOrgConfig } from "@fusionconfig/alldomains";

export type HasYaml = {
  yaml: YamlCapability
}
export interface ThereAndBackContext extends CliContext, HasYaml {
  urlStore: UrlStore
  loadFiles: LoadFilesFn
  postProcessors: PostProcessor[]
}

export function postProcessors ( schemaNameFn: SchemaNameFn, urlStore: UrlStore ): PostProcessor[] {
  return [
    addKafkaSchemasToServices ( defaultKafkaNameFn ( urlStore.loadNamed ) ),
    addTaskDetails (schemaNameFn)
  ]
}

export function makeContext ( version: string ): ThereAndBackContext {
  const urlStore = nodeUrlstore ( shellGitsops (), defaultOrgConfig () )
  const schemaNameFn = defaultSchemaNameFn ( urlStore.loadNamed )
  return thereAndBackContext ( 'fusion', version, fileOpsNode (), jsYaml (), schemaNameFn, urlStore )
}
export const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
export const configFinder = fixedConfig<NoConfig> ( makeContext )

export function thereAndBackContext ( name: string, version: string, fileOps: FileOps, yaml: YamlCapability, schemaNameFn: SchemaNameFn, urlStore: UrlStore ): ThereAndBackContext {
  return { ...cliContext ( name, version, fileOps ), yaml, loadFiles: findConfigUsingFileops ( fileOps, yaml ), postProcessors: postProcessors ( schemaNameFn, urlStore ), urlStore }
}