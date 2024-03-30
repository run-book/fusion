import { findPartInMerged, isMerged, Merged } from "./merge";
import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@laoban/utils";
import { findStringArray } from "./extract.from.merged";
import { NamedUrl, UrlLoadNamedFn, writeUrl } from "@itsmworkbench/urlstore";
import { NamedLoadResult } from "@itsmworkbench/urlstore/dist/src/url.load.and.store";


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
  postProcess: ( full: Merged, sortedValue: Merged, params: NameAnd<string> ) => Promise<ErrorsAnd<Merged>>
}

export async function postProcess ( processors: PostProcessor[], sorted: Merged, params: NameAnd<string> ): Promise<ErrorsAnd<Merged>> {
  const acc = sorted
  for ( let p of processors ) {
    const value = acc.value[ p.key ]
    if ( isMerged ( value ) ) {
      const result = await p.postProcess ( sorted, value, params )
      if ( hasErrors ( result ) ) return result
    }
  }
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

type NameParams = {
  serviceName: string
  topicName: string
}

export function addNameStringToMerged ( merged: Merged, name: string, value: string, addedBy: string ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${name}:${value} # ${addedBy} but is not an object` ]
  const newMerged = { value, files: [ addedBy ] }
  merged.value[ name ] = newMerged
  return merged
}

export type SchemaNameFn = ( nameParams: NameParams, requestOrResponse: string, tastSchemas: string[] ) => Promise<ErrorsAnd<NamedLoadResult<any>>>
export type KafkaNameFn = ( kafkaSchemaName: string ) => Promise<ErrorsAnd<NamedLoadResult<any>>>
export const defaultSchemaNameFn = ( nameToId: UrlLoadNamedFn, debug?: boolean ): SchemaNameFn =>
  async ( nameParams: NameParams, requestOrResponse: string, taskSchemas: string[] ): Promise<ErrorsAnd<NamedLoadResult<any>>> => {
    const realTaskNames = taskSchemas.map ( t =>
      t.replace ( /<task>/g, nameParams.serviceName ).replace ( /<reqOrResp>/g, requestOrResponse ) )
    const taskUrls: NamedUrl[] = realTaskNames.map ( t => ({ scheme: 'itsm', organisation: 'org', namespace: 'schema', name: t }) )
    if ( debug ) {
      console.log ( 'topicName', nameParams.topicName )
      console.log ( 'requestOrResponse', requestOrResponse )
      console.log ( 'taskSchemas', taskSchemas )
      console.log ( 'realTaskNames', realTaskNames )
      console.log ( 'taskUrls', JSON.stringify ( taskUrls ) )
    }
    for ( let url of taskUrls ) {
      const found: ErrorsAnd<NamedLoadResult<any>> = await nameToId ( url )
      if ( !hasErrors ( found ) ) return { ...found, url: writeUrl ( url ) }
    }
    return [ `No schema found for ${nameParams.serviceName}/${nameParams.topicName}/${requestOrResponse} in ${realTaskNames}` ]
  }

export function defaultKafkaNameFn ( loadNamed: UrlLoadNamedFn ): KafkaNameFn {
  return async ( kafkaSchemaName ): Promise<ErrorsAnd<NamedLoadResult<any>>> => {
    const kafkaUrl: NamedUrl = { scheme: 'itsm', organisation: 'org', namespace: 'schema', name: kafkaSchemaName }
    return loadNamed ( kafkaUrl )
  }

}

export async function addRequestOrResponseToService ( serviceName: string, service: Merged, requestOrResponse: string, kafkaSchemaString: string, taskSchemaNames: string[], addedBy: string, nameFn: SchemaNameFn, kafkaNameFn: KafkaNameFn ): Promise<ErrorsAnd<Merged>> {
  const request = findPartInMerged ( service, requestOrResponse )
  const requestTopic: Merged = findPartInMerged ( request, 'topic' )
  const topicName = requestTopic.value
  if ( !topicName ) return [ `addRequestToSchema(${serviceName})- No topic found in ${requestOrResponse}` ]
  if ( typeof topicName !== 'string' ) return [ `addRequestToSchema(${serviceName}) ${requestOrResponse}- Topic must be a string but is ${JSON.stringify ( topicName )}` ]
  const nameParams = { serviceName, topicName }

  return mapErrors ( await nameFn ( nameParams, requestOrResponse, taskSchemaNames ), async ( requestLoaded: NamedLoadResult<any> ) =>
    mapErrors ( addNameStringToMerged ( request, 'task_schema_name', requestLoaded.url, addedBy ), ( ignore ) => {
      const kafkaSchemaName = kafkaSchemaString.replace ( /<service>/g, serviceName ).replace ( /<reqOrResp>/g, requestOrResponse )
      return mapErrors ( addNameStringToMerged ( request, 'task_schema_id', requestLoaded.id, addedBy ), ignore =>
        mapErrors ( addNameStringToMerged ( request, 'kafka_schema', kafkaSchemaName, addedBy ), async ignore =>
          mapErrors ( await kafkaNameFn ( kafkaSchemaName ), kafka =>
            addNameStringToMerged ( request, 'kafka_schema_id', kafka.id, addedBy ) ) ) )
    } ) )
}


export function addTaskSchemasToServices ( nameFn: SchemaNameFn, kafkaNameFn: KafkaNameFn ): PostProcessor {
  return {
    key: 'services',
    postProcess:
      async ( full: Merged, services: Merged, params: NameAnd<string> ): Promise<ErrorsAnd<Merged>> => {
        if ( typeof services.value !== 'object' ) return [ 'services is not an object' ]
        const task_schemas = findPartInMerged ( full, 'task_schemas' )
        if ( !task_schemas ) return [ 'No task_schemas found. These are used to control where we look for schemas' ]
        const taskSchemaNames = findStringArray ( task_schemas )
        if ( taskSchemaNames.length === 0 ) return [ `No task_schemas found. These are used to control where we look for schemas - had value but wasn't an array of string. This might look like  "task.<task>.<reqOrResp>.\${geo}.\${product}.\${channel}"` ]


        const kafkaSchemas = findPartInMerged ( full, 'kafka_schemas' )
        if ( !kafkaSchemas ) return [ 'No kafka_schema found. This string controls how we look for a schema. It would normally be  "service.<service>.<reqOrResp>"' ]
        const kafkaSchemaString = kafkaSchemas.value
        if ( typeof kafkaSchemaString !== 'string' ) return [ `kafka_schema found but not a string. This string controls how we look for a schema. It would normally be  "service.<service>.<reqOrResp>"` ]


        const serviceNames = Object.keys ( services.value )
        for ( let serviceName of serviceNames ) {
          const service = findPartInMerged ( services, serviceName )
          const requestResult = await addRequestOrResponseToService ( serviceName, service, 'request', kafkaSchemaString, taskSchemaNames, 'addRequestsAndResponsesToServices', nameFn, kafkaNameFn )
          if ( hasErrors ( requestResult ) ) return requestResult
          const responseResult = await addRequestOrResponseToService ( serviceName, service, 'response', kafkaSchemaString, taskSchemaNames, 'addRequestsAndResponsesToServices', nameFn, kafkaNameFn )
          if ( hasErrors ( responseResult ) ) return responseResult


        }
      }
  }
}

