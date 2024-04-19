import { evaluateAllDependentItems, EvaluateDiFn } from "./dependant.evaluation";
import { DiRequest, doActions, DoActionsFn, RequestEngine } from "./dependant.execute";
import { TagStore, TagStoreGetter } from "./tag.store";
import { DependentItem } from "./dependent.data";
import { DiTag } from "./tag";

export interface DependentEngine<S> {
  //Produces a list of 'actions' which detail 'what needs doing right now' and 'what needs to be fetched'
  evaluate: EvaluateDiFn<S>
  doActions: DoActionsFn<S>
}

export function dependentEngine<S> ( engine: RequestEngine<S>, tagStore: TagStore<S> ): DependentEngine<S> {
  return {
    evaluate: evaluateAllDependentItems ( tagStore.currentValue ),
    doActions: doActions ( engine, tagStore )
  }
}


let count = 0 // to help deduping debugs
export type SetJsonForDepDataOptions<S> = {
  debug?: () => boolean | undefined
  updateLogs?: ( s: S ) => S // called just before we update the value in the store allowing us to add in any logging/debugging into the state
  setTag?: ( s: S, name: string, tag: DiTag ) => S
  delay?: number
}
function extractDepDataOptionsWithSafeDefaults<S> ( options: SetJsonForDepDataOptions<S> ): Required<SetJsonForDepDataOptions<S>> {
  let { debug, updateLogs, setTag, delay } = options
  if ( debug === undefined ) debug = () => false
  if ( updateLogs === undefined ) updateLogs = ( s ) => s
  if ( setTag === undefined ) setTag = ( s, name, tag ) => s
  if ( delay === undefined ) delay = 0
  return { debug, updateLogs, setTag, delay };
}
const triggerAndProcessUpdates = <S> ( getLatest: () => S,
                                       options: Required<SetJsonForDepDataOptions<S>> ) =>
  ( setJson: ( s: S ) => void, updates: Promise<DiRequest<S>>[] ) => {
    const { delay, setTag, debug: debugFn } = options
    const debug = debugFn () === true;
    updates.forEach ( async u => {
      setTimeout ( async () => {
        const r: DiRequest<S> = await u
        if ( r === undefined ) {
          console.error ( `Had error loading` )
          return
        }
        if ( typeof r !== 'function' ) throw new Error ( `Expected r to be a function. It was ${typeof r}\n${JSON.stringify ( r )}` )
        const stateAndWhy = r ( getLatest () )
        const { name, changed, why } = stateAndWhy
        if ( debug ) console.log ( 'fc - setJson - update', name, changed, why )

        if ( changed ) {
          const { s, t, tag } = stateAndWhy
          if ( debug ) console.log ( 'fc - setJson - t ', t )
          if ( debug ) console.log ( 'fc - setJson - tag', tag )
          if ( debug ) console.log ( 'fc - setJson - setting Json', s )
          const withTags = setTag ( s, name, tag )
          setJson ( withTags )
        }
      }, delay )
    } )
  };
export const setJsonForDepData = <S extends any> ( depEngine: DependentEngine<S>, getLatest: () => S, setS: ( s: S ) => void ) =>
  ( deps: DependentItem<S, any>[], options: SetJsonForDepDataOptions<S> ) => {
    const cleanOptions = extractDepDataOptionsWithSafeDefaults<S> ( options );
    const { debug: debugFn, updateLogs } = cleanOptions
    const trigger = triggerAndProcessUpdates ( getLatest, cleanOptions )
    const setJson = ( s: S ) => {
      const debug = debugFn () === true;
      console.log ( 'setJson', count, s )
      const { status, vAndT, actions } = depEngine.evaluate ( deps ) ( s )
      if ( debug ) console.log ( 'fc - setJson', count, s, status, vAndT, )
      if ( debug ) console.log ( 'fc - setJson - actions', count, actions )
      const us = depEngine.doActions ( actions )
      const { updates, newS } = us
      console.log ( 'updated', us )
      console.log ( 'newS', newS )
      const cleanedS = updateLogs ( newS ( s ) )
      if ( debug ) console.log ( 'fc - setJson - cleanedS', count, cleanedS )
      setS ( cleanedS )
      if ( debug ) console.log ( 'fc - setJson - updates', count, updates.length )
      trigger ( setJson, updates );
    };
    return setJson
  }
