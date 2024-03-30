import { NamedLoadResult, NamedUrl, UrlLoadNamedFn, UrlStore, writeUrl } from "@itsmworkbench/urlstore";
import { addIdAndNameToMerged, findPartInMerged, findStringArray, Merged, PostProcessor } from "@fusionconfig/config";
import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@laoban/utils";
import { loadAllTransformersFromFileSystem, loadPathToJsonForTransformers } from "./transformer";
import { FileOps } from "@laoban/fileops";

export type TransformerNameFn = ( task: string, service: string, requestOrResponse: string, transformerPatterns: string[] ) => Promise<ErrorsAnd<NamedLoadResult<any>>>


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
          console.log('now I have everything I need')
          console.log ( 'taskName', taskName, )
          console.log ( 'serviceName', serviceName, )
          console.log ( 'transformerNames', transformerNames, )
          console.log ( 'pathsInJson', JSON.stringify ( pathsInJson, null, 2 ) )

        }
      }
      if ( errors.length > 0 ) return [ `Error processing 'addTransformersToTasks'`, ...errors ]
      return full
    }
  }
}