import { findPartInMerged, isMerged, Merged } from "./merge";
import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@laoban/utils";
import { NamedLoadResult, NamedUrl, UrlLoadNamedFn, writeUrl } from "@itsmworkbench/urlstore";
import { findStringArray } from "./extract.from.merged";


//This is an implied contract at the moment that config is the actual json object that sorted represents.
//It's not enformed. config is really the 'place to get the info we need to post process and we update sorted with it'. but
//it's very cool if that is the sorted => yaml => json. Massively boosts config cohession

//A concrete example is we want to enrich this. We will add the request schema
//based on what schemas exist. We have a list of the file names that are schemas
//and pick the first one that is relevant based on the ordering in the config file
//the list of schemas would be curried into the specific post processor

// internal_pricingService:
//   description: "Internal pricing service for product and service pricing adjustments."
// request:
//   topic: "internal.pricing.request"
// response:
//   topic: "internal.pricing.response"

export type PostProcessor = {
  key: string //we modify this key. At the moment must be a root thing. Might change this later

  //sorted Value is the current value of the key we return a new value.
  //promise so that we can async things like file system look ups
  //ErrorsAnd so that we can return errors
  postProcess: ( full: Merged, sortedValue: Merged, params: NameAnd<string>, debug: boolean | undefined ) => Promise<ErrorsAnd<Merged>>
}

export async function postProcess ( processors: PostProcessor[], sorted: Merged, params: NameAnd<string>, debug?: boolean ): Promise<ErrorsAnd<Merged>> {
  const acc = sorted
  const errors: string[] = []
  for ( let p of processors ) {
    const value = acc.value[ p.key ]
    if ( isMerged ( value ) ) {
      const result = await p.postProcess ( sorted, value, params, debug )
      if ( hasErrors ( result ) ) errors.push ( ...result )
    }
  }
  if ( errors.length > 0 ) return errors
  return acc
}


//sample input
// internal_pricingService:
//   description: "Internal pricing service for product and service pricing adjustments."
//   request:
//     topic: "internal.pricing.request"
//   response:
//     topic: "internal.pricing.response"
//
//sample output. The contributed by is critical it tells us where the schema came from... which customisation was used. Note that the response example has a uk specific schema but the request doesn't
// internal_pricingService:
//   description: "Internal pricing service for product and service pricing adjustments."
//   request:
//     topic: "internal.pricing.request"
//     schema: "itsmid/org/schema/<someGitShaThatWasTheFileAtTheTimeWeCreatedThis>" # Contributed by schemabot:itsm/org/schema/task.internal_pricingService.request.
//   response:
//     topic: "internal.pricing.response"
//     schema: "itsmid/org/schema/<someGitShaThatWasTheFileAtTheTimeWeCreatedThis>" # Contributed by schemabot:itsm/org/schema/task.internal_pricingService.response.uk.


export function addNameStringToMerged ( merged: Merged, name: string, value: string, addedBy: string ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${name}:${value} # ${addedBy} but is not an object` ]
  const newMerged = { value, files: [ addedBy ] }
  merged.value[ name ] = newMerged
  return merged
}
export function addNameMergedToMerged ( merged: Merged, name: string, value: Merged, addedBy: string ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${name}:${JSON.stringify ( value )} # ${addedBy} but is not an object` ]
  merged.value[ name ] = value
  return merged
}
export function addIdAndNameToMerged ( merged: Merged, name: string, url: NamedLoadResult<any>, addedBy: string ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${url.id}:${url.url} # ${addedBy} but is not an object` ]
  const nameMerged = { value: url.url, files: [ addedBy ] }
  const idMerged = { value: url.id, files: [ addedBy ] }
  const newMerged = { value: { name: nameMerged, id: idMerged, }, files: [ addedBy ] }
  merged.value[ name ] = newMerged
  return merged
}

export function addAllFieldsInMergedToMerge ( merged: Merged, value: Merged, addedBy: string ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${JSON.stringify ( value )} # ${addedBy} but the thing I am mering into is not is not an object\n${JSON.stringify ( merged )}` ]
  if ( typeof value.value !== 'object' ) return [ `Was trying to add ${JSON.stringify ( value )} # ${addedBy} but the value is not an object` ]
  for ( let key in value.value ) {
    merged.value[ key ] = value.value[ key ]
  }
  return merged
}
export type SchemaNameFn = ( task: string, requestOrResponse: string, taskPatterns: string[] ) => Promise<ErrorsAnd<NamedLoadResult<any>>>
export type TransformerNameFn = ( task: string, service: string, requestOrResponse: string, transformerPatterns: string[] ) => Promise<ErrorsAnd<NamedLoadResult<any>>>

export type KafkaNameFn = ( kafkaSchemaName: string ) => Promise<ErrorsAnd<NamedLoadResult<any>>>
export const defaultSchemaNameFn = ( nameToId: UrlLoadNamedFn, debug?: boolean ): SchemaNameFn =>
  async ( task: string, requestOrResponse: string, taskSchemas: string[] ): Promise<ErrorsAnd<NamedLoadResult<any>>> => {
    const realTaskNames = taskSchemas.map ( t =>
      t.replace ( /<task>/g, task ).replace ( /<reqOrResp>/g, requestOrResponse ) )
    const taskUrls: NamedUrl[] = realTaskNames.map ( t => ({ scheme: 'itsm', organisation: 'org', namespace: 'schema', name: t }) )
    if ( debug ) {
      console.log ( 'taskName', task )
      console.log ( 'requestOrResponse', requestOrResponse )
      console.log ( 'taskSchemas', taskSchemas )
      console.log ( 'realTaskNames', realTaskNames )
      console.log ( 'taskUrls', JSON.stringify ( taskUrls ) )
    }
    for ( let url of taskUrls ) {
      const found: ErrorsAnd<NamedLoadResult<any>> = await nameToId ( url )
      if ( !hasErrors ( found ) ) return { ...found, url: writeUrl ( url ) }
    }
    return [ `No schema found for ${task}/${requestOrResponse} in ${realTaskNames}` ]
  }

export const defaultTransformerNameFn = ( nameToId: UrlLoadNamedFn, debug?: boolean ): TransformerNameFn =>
  async ( task: string, service: string, requestOrResponse: string, transformerPatterns: string[] ): Promise<ErrorsAnd<NamedLoadResult<any>>> => {
    const realTransformerNames = transformerPatterns.map ( t =>
      t.replace ( /<task>/g, task ).replace ( /<service>/g, service ).replace ( /<reqOrResp>/g, requestOrResponse ) )
    const taskUrls: NamedUrl[] = realTransformerNames.map ( t => ({ scheme: 'itsm', organisation: 'org', namespace: 'transformer', name: t }) )
    if ( debug ) {
      console.log ( 'taskName', task )
      console.log ( 'service', service )
      console.log ( 'requestOrResponse', requestOrResponse )
      console.log ( 'transformerPatterns', transformerPatterns )
      console.log ( 'realTransformerNames', realTransformerNames )
      console.log ( 'taskUrls', JSON.stringify ( taskUrls ) )
    }
    for ( let url of taskUrls ) {
      const found: ErrorsAnd<NamedLoadResult<any>> = await nameToId ( url )
      if ( !hasErrors ( found ) ) return { ...found, url: writeUrl ( url ) }
    }
    return [ `No transformers found for ${task}/${requestOrResponse} in ${realTransformerNames}` ]
  }

export function defaultKafkaNameFn ( loadNamed: UrlLoadNamedFn ): KafkaNameFn {
  return async ( kafkaSchemaName ): Promise<ErrorsAnd<NamedLoadResult<any>>> => {
    const kafkaUrl: NamedUrl = { scheme: 'itsm', organisation: 'org', namespace: 'schema', name: kafkaSchemaName }
    return mapErrors ( await loadNamed ( kafkaUrl ), url => ({ ...url, url: writeUrl ( kafkaUrl ) }) )
  }

}

export async function addRequestOrResponseToService ( serviceName: string, service: Merged, requestOrResponse: string, kafkaSchemaString: string, addedBy: string, kafkaNameFn: KafkaNameFn ): Promise<ErrorsAnd<Merged>> {
  const request = findPartInMerged ( service, requestOrResponse )
  const requestTopic: Merged = findPartInMerged ( request, 'topic' )
  const topicName = requestTopic.value
  if ( !topicName ) return [ `addRequestToSchema(${serviceName})- No topic found in ${requestOrResponse}` ]
  if ( typeof topicName !== 'string' ) return [ `addRequestToSchema(${serviceName}) ${requestOrResponse}- Topic must be a string but is ${JSON.stringify ( topicName )}` ]
  const kafkaSchemaName = kafkaSchemaString.replace ( /<service>/g, serviceName ).replace ( /<reqOrResp>/g, requestOrResponse )

  return mapErrors ( await kafkaNameFn ( kafkaSchemaName ), kafka =>
    addIdAndNameToMerged ( request, 'kafka', kafka, addedBy ) )
}


export function addKafkaSchemasToServices ( kafkaNameFn: KafkaNameFn ): PostProcessor {
  return {
    key: 'services',
    postProcess:
      async ( full: Merged, services: Merged, params: NameAnd<string>, debug: boolean ): Promise<ErrorsAnd<Merged>> => {
        if(debug)console.log ( 'addKafkaSchemasToServices' )
        if ( typeof services.value !== 'object' ) return [ 'services is not an object' ]

        const kafkaSchemas = findPartInMerged ( full, 'where.services' )
        if ( !kafkaSchemas ) return [ 'No where.services found. This string controls how we look for a schema. It would normally be  "service.<service>.<reqOrResp>"' ]
        const kafkaSchemaString = kafkaSchemas.value
        if ( typeof kafkaSchemaString !== 'string' ) return [ `kafka_schema found but not a string. This string controls how we look for a schema. It would normally be  "service.<service>.<reqOrResp>"` ]
        if ( debug ) {
          console.log ( 'kafkaSchemaString', kafkaSchemaString )
        }

        const serviceNames = Object.keys ( services.value )
        const errors: string[] = []
        for ( let serviceName of serviceNames ) {
          const service = findPartInMerged ( services, serviceName )
          const requestResult = await addRequestOrResponseToService ( serviceName, service, 'request', kafkaSchemaString, 'addRequestsAndResponsesToServices', kafkaNameFn )
          if ( hasErrors ( requestResult ) ) errors.push ( ...requestResult )
          const responseResult = await addRequestOrResponseToService ( serviceName, service, 'response', kafkaSchemaString, 'addRequestsAndResponsesToServices', kafkaNameFn )
          if ( hasErrors ( responseResult ) ) errors.push ( ...responseResult )
        }
        if ( errors.length > 0 ) return [ `Error processing 'addTaskSchemasToServices'`, ...errors ]
      }
  }
}
export async function addRequestOrResponseToTask ( taskName: string, task: Merged, requestOrResponse: string, taskSchemaNames: string[], addedBy: string, nameFn: SchemaNameFn ): Promise<ErrorsAnd<Merged>> {
  let reqResp = findPartInMerged ( task, requestOrResponse );
  if ( !reqResp ) return [ `No ${reqResp} found for task ${taskName}` ]

  return mapErrors ( await nameFn ( taskName, requestOrResponse, taskSchemaNames ), async ( requestLoaded: NamedLoadResult<any> ) =>
    addIdAndNameToMerged ( reqResp, `schema`, requestLoaded, addedBy ) )
}


export function addTaskDetails ( nameFn: SchemaNameFn ): PostProcessor {
  return {
    key: 'tasks',
    postProcess: async ( full: Merged, tasks: Merged, params: NameAnd<string>, debug: boolean ): Promise<ErrorsAnd<Merged>> => {
      if(debug)console.log ( 'addTaskDetails' )

      if ( typeof tasks.value !== 'object' ) return [ 'tasks is not an object' ]

      const taskSchemas = findPartInMerged ( full, 'where.tasks' )
      if ( !taskSchemas ) return [ 'No where.tasks found. These are used to control where we look for schemas' ]
      const taskSchemaNames = findStringArray ( taskSchemas )
      if ( taskSchemaNames.length === 0 ) return [ `No where.tasks found. These are used to control where we look for schemas - had value but wasn't an array of string. This might look like  "task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel}"` ]
      const services = findPartInMerged ( full, 'services' )
      if ( !services ) return [ 'No services found' ]

      const taskNames = Object.keys ( tasks.value )
      if ( debug ) {
        console.log ( 'taskNames', taskNames, )
        console.log ( 'taskSchemaNames', taskSchemaNames, )
      }
      const errors: string[] = []
      for ( let taskName of taskNames ) {
        const task = findPartInMerged ( tasks, taskName )
        const serviceName = findPartInMerged ( task, 'service' )?.value
        if ( !serviceName ) errors.push ( `No service found for tasks ${taskName}. This is mandatory field: we need to know which service will be providing the task` )
        else if ( typeof serviceName !== 'string' ) errors.push ( `The service found for tasks ${taskName} was not a string. It should just be the service name. It was ${JSON.stringify ( serviceName )}` )
        else {
          const service = findPartInMerged ( services, serviceName )
          if ( !service ) errors.push ( `Service ${serviceName} not found for task ${taskName}. This was added by the file ${task.files} at tasks.${taskName}.service` )
          else {
            const serviceDetails = addAllFieldsInMergedToMerge ( task, service, 'addTaskSchemasToServices' )
            if ( hasErrors ( serviceDetails ) ) errors.push ( ...serviceDetails )
            else {
              const req = await addRequestOrResponseToTask ( taskName, task, 'request', taskSchemaNames, 'addTaskSchemasToServices', nameFn )
              if ( hasErrors ( req ) ) errors.push ( ...req )
              const res = await addRequestOrResponseToTask ( taskName, task, 'response', taskSchemaNames, 'addTaskSchemasToServices', nameFn )
              if ( hasErrors ( res ) ) errors.push ( ...res )
            }
          }
        }
      }
      if ( errors.length > 0 ) return [ `Error processing 'addTaskSchemasToServices'`, ...errors ]
    }
  }
}

export async function addTransformerToRequestOrResponse ( transformerNameFn: TransformerNameFn,
                                                          taskName: string,
                                                          service: string,
                                                          task: Merged,
                                                          requestOrResponse: string,
                                                          transformerPatterns: string[],
                                                          addedBy: string ): Promise<ErrorsAnd<Merged>> {
  const reqResp = findPartInMerged ( task, requestOrResponse )
  return mapErrors ( await transformerNameFn ( taskName, service, requestOrResponse, transformerPatterns ),
    async ( transformerLoaded: NamedLoadResult<any> ) =>
      addIdAndNameToMerged ( reqResp, 'transformer', transformerLoaded, addedBy ) )
}

export function addTransformersToTasks ( transformerNameFn: TransformerNameFn ): PostProcessor {
  return {
    key: 'tasks',
    postProcess: async ( full: Merged, tasks: Merged, params: NameAnd<string>, debug: boolean ): Promise<ErrorsAnd<Merged>> => {
      if(debug)console.log ( 'addTransformersToTasks' )
      if ( typeof tasks.value !== 'object' ) return [ 'tasks is not an object' ]
      const transformers = findPartInMerged ( full, 'where.transformers' )
      if ( !transformers ) return [ 'No where.transformers found. These are used to control where we look for transformers' ]
      const transformerNames = findStringArray ( transformers )
      if ( transformerNames.length === 0 ) return [ `No where.transformers found. These are used to control where we look for transformers - had value but wasn't an array of string. This might look like  "task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel}"` ]
      const taskNames = Object.keys ( tasks.value )
      if ( debug ) {
        console.log ( 'taskNames', taskNames, )
        console.log ( 'transformerNames', transformerNames, )
      }
      const errors: string[] = []
      for ( let taskName of taskNames ) {
        const task = findPartInMerged ( tasks, taskName )
        const serviceName = findPartInMerged ( task, 'service' )?.value
        if ( !serviceName ) errors.push ( `No service found for tasks ${taskName}. This is mandatory field: we need to know which service will be providing the task` )
        else if ( typeof serviceName !== 'string' ) errors.push ( `The service found for tasks ${taskName} was not a string. It should just be the service name. It was ${JSON.stringify ( serviceName )}` )
        else {
          const req = await addTransformerToRequestOrResponse ( transformerNameFn, taskName, serviceName, task, 'request', transformerNames, 'addTransformersToTasks' )
          if ( hasErrors ( req ) ) errors.push ( ...req )
          const res = await addTransformerToRequestOrResponse ( transformerNameFn, taskName, serviceName, task, 'response', transformerNames, 'addTransformersToTasks' )
          if ( hasErrors ( res ) ) errors.push ( ...res )
        }
      }
      if ( errors.length > 0 ) return [ `Error processing 'addTransformersToTasks'`, ...errors ]
      return full
    }
  }
}
export function removeServices (): PostProcessor {
  return {
    key: 'services',
    postProcess:
      async ( full: Merged, services: Merged, params: NameAnd<string>, debug: boolean ): Promise<ErrorsAnd<Merged>> => {
        full.value[ 'services' ] = undefined
        return full
      }
  }
}
