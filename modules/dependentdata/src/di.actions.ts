import { DiTag, ValueAndTag, ValueAndTagAndLastTag } from "./tag";
import { DependentItem } from "./dependent.data";

export interface SetTagAction<S, T> {
  type: 'setTag'
  di: DependentItem<S, T>
  tag: DiTag
}
export function isSetTagAction<S, T> ( a: DiAction<S, T> ): a is SetTagAction<S, T> {
  return a?.type === 'setTag'
}

export interface CleanDiAction<S, T> {
  type: 'clean' | 'fetch'
  di: DependentItem<S, T>
  clean?: ValueAndTag // the 'clean' values that will replace the current value. Or undefined if no change
  reason: string // a debug reason why this was created
}
export interface FetchDiAction<S, T> extends CleanDiAction<S, T> {
  type: 'fetch'
  tag: DiTag // the tag of the current value at the moment the action was created
  load?: () => Promise<T> // the load function that will be called to get the new value
  tags: ValueAndTagAndLastTag[] //the tags of the upstreams at the moment the action was created. We don't need all this data but it doesn't hurt. We do need the current tags of the upstreams
}
export function isFetchDiAction<S, T> ( a: DiAction<S, T> ): a is FetchDiAction<S, T> {
  return (a as any).load !== undefined
}
export type DiAction<S, T> = SetTagAction<S, T> | CleanDiAction<S, T> | FetchDiAction<S, T>

