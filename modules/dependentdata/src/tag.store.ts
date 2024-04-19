//We need a way to store the 'current tags'
// This will be different for different implementations
//For example in redux this will be part of the global state
//For other implementations we might use a redux context
//So we abstract this out. This is implemented as a type class

//There are two important ideas here: the selected tags and the current tags
//The selected tags are 'what the customer wants'. They are stored in the Dependent Items
//The current tags are 'what the customer has right now'. They are stored in this TagStore


import { DiTag } from "./tag";
import { Optional, Transform } from "@focuson/lens";
import { NameAnd } from "@laoban/utils";

export type TagStoreGetter<S> = ( s: S, name: string ) => DiTag
export type TagStoreUpdater<S> = ( oldS: S, name: string, value: DiTag ) => Transform<S, DiTag>[]
export interface TagStore<S> {
  //go get me the current stored value. Might ignore (s:S) if it is a global store
  currentValue: TagStoreGetter<S>
  //store the value. If the store is global this returns []
  updateValue: TagStoreUpdater<S>
}

export const globalTagStoreCurrentValue = <S> ( store: NameAnd<DiTag> ): TagStoreGetter<S> => ( s: S, name: string ): DiTag =>
  store[ name ]

export const globalTagUpdateValue = <S> ( store: NameAnd<DiTag> ): TagStoreUpdater<S> => ( oldS: S, name: string, value: DiTag ) => {
  store[ name ] = value
  return []
}
export function globalTagStore<S> ( store: NameAnd<DiTag> ): TagStore<S> {
  return {
    currentValue: globalTagStoreCurrentValue<S> ( store ),
    updateValue: globalTagUpdateValue<S> ( store )
  }
}
export const optionalTagStoreCurrentValue = <S> ( optional: Optional<S, NameAnd<DiTag>> ): TagStoreGetter<S> =>
  ( s: S, name: string ): DiTag =>
    optional.getOption ( s )?.[ name ]

export const optionalTagUpdateValue = <S> ( optional: Optional<S, NameAnd<DiTag>> ): TagStoreUpdater<S> =>
  ( oldS: S, name: string, value: DiTag ): Transform<S, DiTag>[] =>
    [ [ optional.focusQuery ( name ), _ => value ] ]

export function optionalTagStore<S> ( optional: Optional<S, NameAnd<DiTag>> ): TagStore<S> {
  return {
    currentValue: optionalTagStoreCurrentValue<S> ( optional ),
    updateValue: optionalTagUpdateValue<S> ( optional )
  }
}