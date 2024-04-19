import { CleanDiAction, DiAction, FetchDiAction, isFetchDiAction, isSetTagAction, SetTagAction, } from "./di.actions";

import { callListeners, getOrUpdateFromPromiseCache, PromiseCacheListener, TwoKeyPromiseCache } from "@itsmworkbench/utils";
import { DiTag, diTagChanged } from "./tag";
import { TagStore, TagStoreGetter, TagStoreUpdater } from "./tag.store";
import { dependents } from "./dependent.data";
import { collect, flatMap } from "@laoban/utils";
import { massTransform, Transform } from "@focuson/lens";

//Why this shape?
//Because things change across time. So I want to mutate the current state
//I thus need to check before I  do the mutation that the upstream hashes are the same
//These means that if there is a 'load' on a part of the state... it becomes managed state
//Note that the DoActionRes when we have 'updates' takes a new S. This is 'the current S'

export type DoActionsFn<S> = ( dis: DiAction<S, any>[] ) => DoActionRes<S>

export type DoActionRes<S> = {
  newS: ( s: S ) => S // has all the nuked or defaulted values. The ones we know 'now'
  updates: Promise<DiRequest<S>>[] // all the things that will be done in the future
}

export type DiRequest<S> = ( s: S ) => StateAndWhy<S>

export type RequestEngine<S> = TwoKeyPromiseCache<DiAction<S, any>, DiRequest<S>>


export const executeClean = <S> ( engine: RequestEngine<S> ) => ( s: S, a: DiAction<S, any> ): S => {
  const clean = (a as CleanDiAction<S, any>).clean
  if ( clean === undefined ) return s
  callListeners ( engine.listeners, 'info', l => l.info ( a, 'clean', JSON.stringify ( clean ) ) )
  return a.di.optional.set ( s, clean.value )
};
export function executeAllCleans<S> ( engine: RequestEngine<S>, s: S, actions: DiAction<S, any>[] ): S {
  return actions.reduce ( executeClean ( engine ), s )
}

export type StateAndWhyWontChange<S> = {
  name: string
  t: any
  changed: false
  why: string
}
export type StateAndWhyWillChange<S> = {
  s: S
  name: string
  t: any
  changed: true
  tag: DiTag
  why: string
}
export type StateAndWhy<S> = StateAndWhyWontChange<S> | StateAndWhyWillChange<S>

export const uncachedSendRequestForFetchAction = <S, T> ( listeners: PromiseCacheListener<DiAction<S, T>, T>[], tagGetter: TagStoreGetter<S> ) =>
  ( a: FetchDiAction<S, T> ) => async (): Promise<DiRequest<S>> => {
    const t = await a.load ()
    return ( s: S ) => {
      const deps = dependents ( a.di.dependsOn );
      const changed = flatMap ( deps, ( d, i ) => {
        const from = a.tags[ i ].tag;
        const newValue = tagGetter ( s, d.name );
        return diTagChanged ( from, newValue ) ? [ `${d.name}:${from}=>${newValue}` ] : [];
      } )
      if ( changed.length > 0 ) {//don't do anything if upstreams have changed as our data is probably wrong, and we want a new load to get it...
        console.log ( 'loadAbandoned', changed.join ( ',' ) )
        console.log ( 'loadAbandoned', a )
        callListeners ( listeners, 'loadAbandoned', l => l.loadAbandoned ( a, changed.join ( ',' ) ) )
        return { why: `Changed ${changed.join ( ',' )}`, changed: false, t, name: a.di.name }
      }
      const rawNewS = a.di.optional.set ( s, t )
      const newS = rawNewS === undefined ? s : rawNewS
      const tag = a.di.tagFn ( t )
      return { s: newS, why: `Loaded ${a.di.name}`, changed: true, t, name: a.di.name, tag }
    }
  }

export const sendRequestForFetchAction = <S, T> ( engine: RequestEngine<S>, tagGetter: TagStoreGetter<S> ) => {
  const uncachedRequest = uncachedSendRequestForFetchAction ( engine.listeners, tagGetter )
  return async ( a: FetchDiAction<S, T> ): Promise<DiRequest<S>> => {
    const name = a.di.name
    const tags = JSON.stringify ( a.tags );//so won't resend unless up stream changes
    return getOrUpdateFromPromiseCache ( engine, a, name, tags, uncachedRequest ( a ) )
  };
}

const addTags = <S> ( tagS: TagStoreUpdater<S> ) => ( dis: DiAction<S, any>[], s: S ): S => {
  const tagActions = collect(dis, isSetTagAction, a => a as SetTagAction<S, any>)
  const txs =  flatMap(tagActions, a => tagS ( s, a.di.name, a.tag ))
  const withTags = massTransform ( s, ...txs )
  return withTags === undefined ? s : withTags
}
export function doActions<S> ( engine: RequestEngine<S>, tagstore: TagStore<S> ): DoActionsFn<S> {
  const sendRequest = sendRequestForFetchAction ( engine, tagstore.currentValue )
  return ( dis: DiAction<S, any>[] ): DoActionRes<S> => {
    const fetchActions = collect ( dis, isFetchDiAction, a => a as FetchDiAction<S, any> )
    const newS = ( s: S ) => {
      const withTags = addTags ( tagstore.updateValue ) ( dis, s )
      return executeAllCleans ( engine, withTags, dis )
    }
    const updates = fetchActions.map ( sendRequest )
    return { newS, updates }
  }
}

