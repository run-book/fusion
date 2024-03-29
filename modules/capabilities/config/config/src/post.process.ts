import { findPartInMerged, isMerged, Merged } from "./merge";
import { ErrorsAnd, hasErrors, mapErrors, mapErrorsK, NameAnd } from "@laoban/utils";


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
  postProcess: ( sortedValue: Merged, config: any, params: NameAnd<string> ) => Promise<ErrorsAnd<Merged>>
}

export async function postProcess ( processors: PostProcessor[], sorted: Merged, config: any, params: NameAnd<string> ): Promise<ErrorsAnd<Merged>> {
  const acc = sorted
  for ( let p of processors ) {
    const value = acc.value[ p.key ]
    if ( isMerged ( value ) ) {
      const result = await p.postProcess ( value, config, params )
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

export function addNameStringToMerged ( merged: Merged, name: string, value: string, files: string[] ): ErrorsAnd<Merged> {
  if ( typeof merged.value !== 'object' ) return [ `Was trying to add ${name}:${value} but not an object\n${JSON.stringify ( merged.value )}` ]
  merged.files = files
  const newMerged = { value, files: [ ...merged.files ] }
  merged.value[ name ] = newMerged
  return merged
}

type SchemaNameFn = ( nameParams: NameParams, requestOrResponse: string ) => Promise<ErrorsAnd<string>>
export async function addRequestOrResponseToService ( serviceName: string, service: Merged, requestOrResponse: string, file: string, nameFn: SchemaNameFn ): Promise<ErrorsAnd<Merged>> {
  const request = findPartInMerged ( service, requestOrResponse )
  const requestTopic: Merged = findPartInMerged ( request, 'topic' )
  const topicName = requestTopic.value
  if ( !topicName ) return [ `addRequestToSchema(${serviceName})- No topic found in ${requestOrResponse}` ]
  if ( typeof topicName !== 'string' ) return [ `addRequestToSchema(${serviceName}) ${requestOrResponse}- Topic must be a string but is ${JSON.stringify ( topicName )}` ]
  const nameParams = { serviceName, topicName }
  return mapErrors ( await nameFn ( nameParams, requestOrResponse ), async requestName =>
    addNameStringToMerged ( request, 'schema', requestName, [ file ] ) )
}


export function addRequestsAndResponsesToServices ( nameFn: SchemaNameFn ): PostProcessor {
  return {
    key: 'services',
    postProcess:
      async ( services: Merged, config: any, params: NameAnd<string> ): Promise<ErrorsAnd<Merged>> => {
        if ( typeof services.value !== 'object' ) return [ 'services is not an object' ]

        const serviceNames = Object.keys ( services.value )
        for ( let serviceName of serviceNames ) {
          const service = findPartInMerged ( services, serviceName )
          const requestResult = await addRequestOrResponseToService ( serviceName, service, 'request', 'addRequestsAndResponsesToServices', nameFn )
          if ( hasErrors ( requestResult ) ) return requestResult
          const responseResult = await addRequestOrResponseToService ( serviceName, service, 'response', 'addRequestsAndResponsesToServices', nameFn )
          if ( hasErrors ( responseResult ) ) return responseResult
        }
      }
  }
}