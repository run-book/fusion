import { cliContext, CliContext, CliTc, fixedConfig } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";
import { fileOpsNode } from "@laoban/filesops-node";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { UrlStore } from "@itsmworkbench/urlstore";
import { NoConfig } from "../index";
import { CommentFactoryFunction, defaultCommentFactoryFunction, LoadFilesFn, PostProcessor, removeKey, } from "@fusionconfig/config";
import { addTaskDetails, defaultSchemaNameFn, SchemaNameFn, } from "@fusionconfig/tasks";
import { addKafkaSchemasToServices, defaultKafkaNameFn } from "@fusionconfig/services";
import { findConfigUsingFileops } from "@fusionconfig/fileopsconfig";
import { nodeUrlstore } from "@itsmworkbench/nodeurlstore";
import { shellGitsops } from "@itsmworkbench/shellgit";
import { defaultOrgConfig } from "@fusionconfig/alldomains";
import { addTransformersToTasks } from "@fusionconfig/transformer";

export type HasYaml = {
  yaml: YamlCapability
}
export interface ThereAndBackContext extends CliContext, HasYaml {
  urlStore: UrlStore
  loadFiles: LoadFilesFn
  postProcessors: ( directory: string ) => PostProcessor[]
  commentFactoryFn: CommentFactoryFunction
}

export function postProcessors ( fileOps: FileOps, schemaNameFn: SchemaNameFn, urlStore: UrlStore, directory: string ): PostProcessor[] {
  if ( !directory ) throw new Error ( 'No directory' )
  return [
    addKafkaSchemasToServices ( defaultKafkaNameFn ( urlStore.loadNamed ) ),
    addTaskDetails ( schemaNameFn ),
    addTransformersToTasks ( fileOps, urlStore.loadNamed, directory,false ),
    removeKey ( 'services' )
  ]
}

export function makeContext ( version: string ): ThereAndBackContext {
  let yamlCapability = jsYaml ();
  const urlStore = nodeUrlstore ( shellGitsops (), defaultOrgConfig ( yamlCapability ) )
  const schemaNameFn = defaultSchemaNameFn ( urlStore.loadNamed )
  return thereAndBackContext ( 'fusion', version, fileOpsNode (), yamlCapability, schemaNameFn, defaultCommentFactoryFunction, urlStore )
}
export const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
export const configFinder = fixedConfig<NoConfig> ( makeContext )

export function thereAndBackContext ( name: string, version: string,
                                      fileOps: FileOps, yaml: YamlCapability,
                                      schemaNameFn: SchemaNameFn,
                                      commentFactoryFn: CommentFactoryFunction,
                                      urlStore: UrlStore ): ThereAndBackContext {
  return {
    ...cliContext ( name, version, fileOps ),
    yaml,
    loadFiles: findConfigUsingFileops ( fileOps, yaml ),
    postProcessors: directory => postProcessors ( fileOps, schemaNameFn, urlStore, directory ),
    commentFactoryFn,
    urlStore
  }
}