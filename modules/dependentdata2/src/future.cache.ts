import { callListeners, PromiseCacheListener } from "@itsmworkbench/utils";


/** This cache is written assuming that there won't be that many calls at once. It's for the dependant data. Thus a linear search for the params */

export interface CallStatus<Context> {
  context: Context
  params: any[]
  value: Promise<any>
}
export interface FutureCache<Context> {
  listeners: PromiseCacheListener<Context, any>[]
  cache: CallStatus<any>[]
}

function shallowCompareArrays ( arr1: any[], arr2: any[] ) {
  if ( arr1.length !== arr2.length ) return false; // Different lengths, definitely not equal
  for ( let i = 0; i < arr1.length; i++ )
    if ( arr1[ i ] !== arr2[ i ] ) return false;
  return true;
}

export function findInFutureCache<Context> ( cache: FutureCache<Context>, params: any[] ): CallStatus<any> | undefined {
  return cache.cache.find ( c => shallowCompareArrays ( c.params, params ) )
}

export async function getOrUpdateFromFutureCache<Context> ( cache: FutureCache<Context>,
                                                            context: Context,
                                                            params: any[],
                                                            raw: ( params: any[] ) => Promise<any> ): Promise<any> {
  const { listeners } = cache
  const found = cache.cache.find ( c => shallowCompareArrays ( c.context === context && c.params, params ) )
  if ( found ) {
    callListeners ( listeners, 'duplicateCall', l => l.duplicateCall ( context ) )
    return found.value
  }
  callListeners ( listeners, 'callingLoad', l => l.callingLoad ( context ) )
  const result = raw ( params ).then ( res => {
    callListeners ( listeners, 'loadArrived', l => l.loadArrived ( context, res ) )
    return res
  } ).catch ( e => {
    callListeners ( listeners, 'loadError', l => l.loadError ( context, e ) )
    return undefined
  } )
  cache.cache.push ( { context, params, value: result } )
  return result
}

