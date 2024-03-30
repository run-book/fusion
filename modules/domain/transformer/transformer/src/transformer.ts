import { NamedLoadResult, NamedUrl, NameSpaceDetailsForGit, nameSpaceDetailsForGit, parseNamedUrlOrThrow, UrlStore } from "@itsmworkbench/urlstore";
import { mapPathsK, pathListToJson, PathsInJson, removeLastExtension } from "@fusionconfig/utils";
import { ErrorsAnd, hasErrors, mapErrors, mapErrorsK, reportErrors } from "@laoban/utils";
import { defaultIgnoreFilter, FileOps } from "@laoban/fileops";
import path from "path";
import { findChildFiles } from "fusionconfig/dist/src/find.files";


export type RequestTransformerMeta = {
  url: NamedUrl
  service: string
  task: string
  request: true
}
export type ResponseTransformerMeta = {
  url: NamedUrl
  service: string
  task: string
  response: true
}
export type TransformerMeta = RequestTransformerMeta | ResponseTransformerMeta
export type TransformMetaSummary = {
  path: string
  url: string
  id: string
  task: string
  service: string
  direction: string
  converter: string
}
export type TransformerPathAndLoadResult = {
  path: string
  tm: TransformerMeta
  loaded: NamedLoadResult<string>
  summary: TransformMetaSummary
}

export function transformerDirection ( m: TransformerMeta ): string {
  return (m as any).request ? 'request' : 'response'
}

export function pathToTransformerUrl ( path: string ): NamedUrl {
  return parseNamedUrlOrThrow ( `itsm/org/transformer/${removeLastExtension ( path )}` )
}

export type MetasAndErrors = { metas: TransformerPathAndLoadResult[], errors: string[] }

export async function loadPathToJsonForTransformers ( directory: string, fileOps: FileOps ) {
  const start = path.join ( directory, 'org', transformNs.pathInGitRepo )
  const dotExtension = '.' + transformNs.extension
  const childFiles = await findChildFiles ( fileOps, defaultIgnoreFilter, s => s.endsWith ( dotExtension ) ) ( start )
  const json = pathListToJson ( childFiles, `Expecting only one file with extension ${dotExtension}: ` )
  return json;
}
export async function loadAllTransformersFromFileSystem ( fileOps: FileOps, urlStore: UrlStore, directory: string ): Promise<MetasAndErrors> {
  const json = await loadPathToJsonForTransformers ( directory, fileOps );
  if ( hasErrors ( json ) ) return { metas: [], errors: json }
  return await loadAllTransformers ( json, urlStore )
}

export async function loadAllTransformers ( json: PathsInJson, urlStore: UrlStore ): Promise<MetasAndErrors> {
  const x: ErrorsAnd<TransformerPathAndLoadResult>[] = await mapPathsK ( json, path => {
    return mapErrorsK ( pathToTransformerMeta ( path ), async tm =>
      mapErrors ( await urlStore.loadNamed<string> ( tm.url ), loaded => {
        const summary: TransformMetaSummary = {
          path, url: loaded.url,
          id: loaded.id, task: tm.task, service: tm.service,
          direction: transformerDirection ( tm ),
          converter: loaded.result
        }
        return { tm, loaded, path, summary }
      } ) )
  } )
  const errors: string[] = []
  const metas: TransformerPathAndLoadResult[] = []
  x.forEach ( x => {
    if ( typeof x === 'string' ) errors.push ( x )
    else // this is actually a bug somewhere else
    if ( hasErrors ( x ) ) errors.push ( ...x )
    else {
      // console.log ( 'x', x )
      metas.push ( x )
    }
  } )
  return { metas, errors }
}


//Rule is that the path will be something like
// <task>.<service>.taskToService/ other stuff.jsonata
//.<task>.<service>.serviceToTask/ other stuff.jsonata
//so we need to to split by /

const sToT = 'service_to_task'
const tToS = 'task_to_service'
export function pathToTransformerMeta ( path: string ): ErrorsAnd<TransformerMeta> {
  const parts = path.split ( '/' )
  if ( parts.length < 3 ) return [ `Path ${path} does not have enough parts. Expecting <task>.<service>.${sToT}/.. or <task>.<service>.${tToS}/...` ]
  const task = parts[ 0 ]
  const service = parts[ 1 ]
  const direction = parts[ 2 ]
  if ( direction !== sToT && direction !== tToS ) return [ `Path ${path} does not have the correct 'direction' ${direction}. Expecting <task>.<service>.${sToT}/.. or <task>.<service>.${tToS}/...` ]
  const url = pathToTransformerUrl ( path )
  if ( direction === tToS ) {
    return { task, service, request: true, url }
  } else
    return { task, service, response: true, url }
}

export const transformNs: NameSpaceDetailsForGit =
               nameSpaceDetailsForGit ( 'transformer', {
                 parser: async ( id: string, s: string ) => s,
                 writer: ( s: string ) => s,
                 extension: 'jsonata',
               } )