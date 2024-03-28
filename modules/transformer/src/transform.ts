import { flatMap, flatMapK, hasErrors, NameAnd, toArray } from "@laoban/utils";
import path from "path";
import { FileOps } from "@laoban/fileops";
import { derefence, dollarsBracesVarDefn } from "@laoban/variables";
import { YamlCapability } from "@itsmworkbench/yaml";
import { extractPlaceholders } from "./utils";

export interface LegalParameter {
  legal: string[]
}
export function isLegalParameter ( x: any ): x is LegalParameter {
  return x.legal !== undefined
}
export type Parameter = LegalParameter | {}
export interface ConfigFile {
  version: 1
  parameters: NameAnd<Parameter> // for example capacity: {legalValues: ['AML', 'creditCheck']}
  // Name is just descriptive, value is the filepath we will be loading
  //Note that we can have  parameters in the file path.
  //  - name: "Channel Specific Configuration"
  //     path: "get/${geo}/${product}/${channel}/{geo}_${product}_${channel}.yaml"
  hierarchy: NameAnd<string>

  //The actual values.
  values: NameAnd<any>
}


type FileAndYaml = {
  file: string
  yaml: any
}


function toObject<T> ( x: undefined | NameAnd<T> | T ): NameAnd<T> {
  if ( x === undefined ) return {}
  if ( typeof x === 'object' ) return x as NameAnd<T>
  return { default: x }
}

type LoadContext = {
  fileOps: FileOps
  yaml: YamlCapability,
  dic: any
}

export type FileDetails = {
  trail: string[]
  file: string
  exists: boolean
  errors: string[]
  yaml: any | undefined
}
export function validateHierarchy ( hierarchy: NameAnd<string> ): string[] {
  if ( hierarchy === undefined ) return []
  if ( typeof hierarchy !== 'object' ) return [ `Hierarchy must be an object` ]
  return flatMap ( Object.entries ( hierarchy ), ( [ k, v ] ) => {
    if ( typeof v !== 'string' ) return [ `Hierarchy value for '${k}' must be a string` ]
    return []
  } )
}
export function validateParameters ( dic: any, properties: NameAnd<Parameter> ): string[] {
  if ( properties === undefined ) return []
  if ( typeof properties !== 'object' ) return [ `Parameters must be an object` ]
  const notInProperties = Object.keys ( dic ).filter ( k => properties[ k ] === undefined )
  if ( notInProperties.length > 0 ) return [ `The parameters ${notInProperties.join ( ', ' )} are not allowed` ]
  return flatMap ( Object.entries ( properties ), ( [ k, v ] ) => {
    if ( dic[ k ] === undefined ) return [ `The parameter '${k}' is not defined` ]
    if ( isLegalParameter ( v ) ) {
      if ( !Array.isArray ( v.legal ) ) return [ `Legal values for '${k}' must be an array` ]
      for ( let lv in v.legal ) if ( typeof lv !== 'string' )
        return [ `Legal value for '${k}' must be a string` ]
      if ( !v.legal.includes ( dic[ k ] ) )
        return [ `The value '${dic[ k ]}' for '${k}' is not legal. Legal values are ${JSON.stringify ( v.legal )}` ]
    }
    return []
  } )
}

export async function recursivelyFindFileNames ( context: LoadContext, root: string, trail: string[], file: string, debug: boolean ): Promise<FileDetails[]> {
  const { fileOps, yaml, dic } = context
  if ( trail.includes ( file ) ) throw new Error ( `Circular reference detected: ${trail.join ( ' -> ' )} -> ${file}` )
  let newFile = path.join ( root, file );
  const newPathForFile = path.dirname ( newFile )
  if ( !await fileOps.isFile ( newFile ) ) return [ { trail, file, exists: false, errors: [], yaml: undefined } ]
  const content = await fileOps.loadFileOrUrl ( newFile )
  const allParams = extractPlaceholders ( content )
  const missingParams = allParams.filter ( p => dic[ p ] === undefined ).map ( s => '${' + s + '}' )
  if ( missingParams.length > 0 ) return [ { trail, file, exists: true, errors: [ `Illegal parameter(s) ${missingParams.join ( ', ' )}` ], yaml: undefined } ]
  const derefed = derefence ( newFile, dic, content, { variableDefn: dollarsBracesVarDefn, allowUndefined: true } )
  const yamlContent = yaml.parser ( derefed )
  if ( hasErrors ( yamlContent ) ) return [ { trail, file, exists: true, errors: toArray ( yamlContent ), yaml: undefined } ]
  const hierarchy = yamlContent?.hierarchy
  let parameters = yamlContent?.parameters;
  const errors = [ ...validateHierarchy ( hierarchy ), ...validateParameters ( dic, parameters ) ]
  if ( errors.length > 0 ) return [ { trail, file, exists: true, errors, yaml: yamlContent } ]
  const fromHierarchy = await flatMapK ( Object.values ( toObject<string> ( hierarchy ) ),
    f => recursivelyFindFileNames ( context, newPathForFile, [ ...trail, file ], f, debug ) )
  return [ { trail, file, exists: true, errors, yaml: yamlContent }, ...fromHierarchy ]
}

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