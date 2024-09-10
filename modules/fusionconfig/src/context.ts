import { cliContext, CliContext, CliTc, fixedConfig } from "@itsmworkbench/cli";
import { YamlCapability } from "@itsmworkbench/yaml";
import { FileOps } from "@laoban/fileops";
import { fileOpsNode } from "@laoban/filesops-node";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { UrlLoadNamedFn, UrlStore } from "@itsmworkbench/urlstore";
import { NoConfig } from "../index";
import { CommentFactoryFunction, defaultCommentFactoryFunction, LoadFilesFn, PostProcessor, removeKey, } from "@fusionconfig/config";
import { addTaskDetails, defaultSchemaNameFn, SchemaNameFn, } from "@fusionconfig/tasks";
import { addKafkaSchemasToServices, defaultKafkaNameFn } from "@fusionconfig/services";
import { findConfigUsingFileops } from "@fusionconfig/fileopsconfig";
import { nodeUrlstore } from "@itsmworkbench/nodeurlstore";
import { shellGitsops } from "@itsmworkbench/shellgit";
import { defaultOrgConfig } from "@fusionconfig/alldomains";
import { addTransformersToTasks, cachedUrlLoadFn, findCachedOrRawTransMapAndErrors } from "@fusionconfig/transformer";
import { camundaFetch, CamundaFetch } from "@fusionconfig/camunda";

import { NameAnd } from "@laoban/utils";
import { AuthFn, defaultAuthFn, FetchFn, FetchFnResponse } from "@fusionconfig/auth";
import fetch from 'node-fetch'


export type HasYaml = {
  yaml: YamlCapability
}
export interface ThereAndBackContext extends CliContext, HasYaml {
  urlStore: ( dir: string ) => UrlStore
  camundaFetch: CamundaFetch
  loadFiles: LoadFilesFn
  auth: AuthFn
  postProcessors: ( cached: boolean, directory: string ) => PostProcessor[]
  commentFactoryFn: CommentFactoryFunction
}

export function postProcessors ( fileOps: FileOps, schemaNameFn: SchemaNameFn, loadNamed: UrlLoadNamedFn, directory: string, cached: boolean | undefined ): PostProcessor[] {
  if ( !directory ) throw new Error ( 'No directory' )
  const load = cached ? cachedUrlLoadFn ( loadNamed ) : loadNamed
  return [
    addKafkaSchemasToServices ( defaultKafkaNameFn ( load ) ),
    addTaskDetails ( schemaNameFn ),
    addTransformersToTasks ( findCachedOrRawTransMapAndErrors ( fileOps, directory, load ) ( cached ) ),
    removeKey ( 'services' ),
    removeKey ( 'parameters' ),
    removeKey ( 'hierarchy' ),
    removeKey ( 'where' ),
  ]
}
const fetchFn: FetchFn = async ( url, options ) => {
  // console.log ( `Fetching: ${url}` )
  const { headers, method, body } = options || {}
  const actualHeaders = typeof headers === 'function' ? await headers () : headers
  const res = await fetch ( url, { method, body, headers: actualHeaders } );
  const respHeaders: NameAnd<string> = {}
  res.headers.forEach ( ( value: string, name: string ) => {
    respHeaders[ name ] = value
  } )
  if ( res.status === 401 ) {
    if ( !options?.silentError )
      console.log ( url, ' 401', actualHeaders?.[ 'Authorization' ]?.substring ( 0, 12 ) )
    // console.log ( await res.text () )

  }
  if ( res.status === 403 ) {
    if ( !options?.silentError ) console.log ( url, '403' )
  }
  if ( res.status === 429 ) {
    if ( !options?.silentError ) console.log ( url, '429', respHeaders )
    throw Error ( 'Too many requests' )
  }
  if ( res.status >= 500 ) {
    if ( !options?.silentError ) console.log ( url, res.status, respHeaders )
    if ( !options?.silentError ) console.log ( await res.text () )
    throw Error ( 'Server error' )
  }

  const result: FetchFnResponse = {
    status: res.status,
    ok: res.ok,
    body: res.body,
    json: () => res.json (),
    text: () => res.text (),
    headers: respHeaders,
    statusText: res.statusText
  }
  return result;
}
export function makeContext ( version: string ): ThereAndBackContext {
  let yamlCapability = jsYaml ();
  const urlStore = ( dir: string ) => nodeUrlstore ( shellGitsops (), defaultOrgConfig ( dir, yamlCapability ) )
  return thereAndBackContext ( 'fusion', version, fileOpsNode (), yamlCapability, defaultCommentFactoryFunction, urlStore, process.env, fetchFn )
}
export const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
export const configFinder = fixedConfig<NoConfig> ( makeContext )

export function thereAndBackContext ( name: string, version: string,
                                      fileOps: FileOps, yaml: YamlCapability,
                                      commentFactoryFn: CommentFactoryFunction,
                                      urlStore: ( dir: string ) => UrlStore,
                                      env: NameAnd<string | undefined>,
                                      fetchFn: FetchFn ): ThereAndBackContext {

  return {
    ...cliContext ( name, version, fileOps ),
    yaml,
    loadFiles: findConfigUsingFileops ( fileOps, yaml ),
    postProcessors: ( cached, directory ) => {
      let thisUrlStore = urlStore ( directory );
      return postProcessors ( fileOps, defaultSchemaNameFn ( thisUrlStore.loadNamed ), thisUrlStore.loadNamed, directory, cached );
    },
    commentFactoryFn,
    urlStore,
    auth: defaultAuthFn ( env, fetchFn, () => new Date ().getTime (), {} ),
    camundaFetch: camundaFetch ( fetchFn, env, )
  }
}