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