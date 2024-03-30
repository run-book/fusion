import { NamedLoadResult, NamedUrl, UrlLoadNamedFn, UrlStore, writeUrl } from "@itsmworkbench/urlstore";
import { addIdAndNameToMerged, addNameStringToMerged, findPartInMerged, findStringArray, Merged, PostProcessor } from "@fusionconfig/config";
import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@laoban/utils";
import { loadAllTransformersFromFileSystem, loadOneTransformerPathAndLoadResult, loadPathToJsonForTransformers, pathToTransformerMeta, serviceToTask, taskToService, TransformerPathAndLoadResult } from "./transformer";
import { FileOps } from "@laoban/fileops";
import { findFirstPath, PathsInJson } from "@fusionconfig/utils";
import { TransformerNameFn } from "./transformer.post.processor.old";

export async function addTransformerToRequestOrResponse (
  task: Merged,
  tx: TransformerPathAndLoadResult,
  addedBy: string ): Promise<ErrorsAnd<Merged>> {
  const reqResp = findPartInMerged ( task, tx.summary.reqOrResp )
  return addIdAndNameToMerged ( reqResp, 'transformer', tx.loaded, addedBy )
}

async function processRequestAndResponse ( task: Merged, taskName: string, direction: string, transformerNames: string[], serviceName: string, pathsInJson: PathsInJson, urlStore: UrlStore, debug: boolean ) {
  const errors: string[] = []
  const modifiedTransformerNames = transformerNames.map (
    t => t.replace ( '<task>', taskName ).replace ( '<service>', serviceName ).replace ( '<direction>', direction ) )
  const found = findFirstPath ( modifiedTransformerNames, pathsInJson )
  if ( debug ) {
    console.log ( 'now I have everything I need' )
    console.log ( 'taskName', taskName, )
    console.log ( 'serviceName', serviceName, )
    console.log ( 'modifiedTransformerNames', modifiedTransformerNames, )
    console.log ( 'pathsInJson', JSON.stringify ( pathsInJson, null, 2 ) )
    console.log ( 'found', found )
  }
  if ( !found ) errors.push ( `No transformer found for ${taskName} and ${serviceName} with direction ${direction} ` ); else {
    const meta = pathToTransformerMeta ( found )
    if ( hasErrors ( meta ) ) errors.push ( ...meta ); else {
      if ( debug ) console.log ( 'meta', meta )
      const loaded = await loadOneTransformerPathAndLoadResult ( urlStore, found ) ( meta )
      if ( debug ) console.log ( 'loaded', loaded )
      if ( hasErrors ( loaded ) ) errors.push ( ...loaded ); else {
        const addT = await addTransformerToRequestOrResponse ( task, loaded, 'addTransformersToTasks' )
        if ( hasErrors ( addT ) ) errors.push ( ...addT )
      }
    }
  }
  if ( errors.length > 0 ) return [ `Error processing 'addTransformersToTasks'`, ...errors ]
  return task
}
export function addTransformersToTasks ( fileOps: FileOps, urlStore: UrlStore, directory: string ): PostProcessor {
  return {
    key: 'tasks',
    postProcess: async ( full: Merged, tasks: Merged, params: NameAnd<string>, debug: boolean ): Promise<ErrorsAnd<Merged>> => {
      if ( debug ) console.log ( 'addTransformersToTasks' )
      const pathsInJson = await loadPathToJsonForTransformers ( directory, fileOps )
      if ( hasErrors ( pathsInJson ) ) return pathsInJson

      if ( typeof tasks.value !== 'object' ) return [ 'tasks is not an object' ]
      const transformers = findPartInMerged ( full, 'where.transformers' )
      if ( !transformers ) return [ 'No where.transformers found. These are used to control where we look for transformers' ]
      const transformerNames = findStringArray ( transformers )
      if ( transformerNames.length === 0 ) return [ `No where.transformers found. These are used to control where we look for transformers - had value but wasn't an array of string. This might look like  "task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel}"` ]
      const taskNames = Object.keys ( tasks.value )
      if ( debug ) {
        console.log ( 'taskNames', taskNames, )
        console.log ( 'transformerNames', transformerNames, )
        console.log ( 'pathsInJson', JSON.stringify ( pathsInJson, null, 2 ) )
      }
      const errors: string[] = []
      for ( let taskName of taskNames ) {
        const task = findPartInMerged ( tasks, taskName )
        const serviceName = findPartInMerged ( task, 'service' )?.value
        if ( !serviceName ) errors.push ( `No service found for tasks ${taskName}. This is mandatory field: we need to know which service will be providing the task` )
        else if ( typeof serviceName !== 'string' ) errors.push ( `The service found for tasks ${taskName} was not a string. It should just be the service name. It was ${JSON.stringify ( serviceName )}` )
        else {
          const fromRq = await processRequestAndResponse ( task, taskName, serviceToTask, transformerNames, serviceName, pathsInJson, urlStore, debug );
          if ( hasErrors ( fromRq ) ) errors.push ( ...fromRq )
          const fromRes = await processRequestAndResponse ( task, taskName, taskToService, transformerNames, serviceName, pathsInJson, urlStore, debug );
          if ( hasErrors ( fromRes ) ) errors.push ( ...fromRes )
        }
      }
      if ( errors.length > 0 ) return [ `Error processing 'addTransformersToTasks'`, ...errors ]
      return full
    }
  }
}