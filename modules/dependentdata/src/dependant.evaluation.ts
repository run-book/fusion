import { NameAnd } from "@laoban/utils";
import { diTagChanged, ValueAndTagAndLastTag } from "./tag";
import { TagStoreGetter } from "./tag.store";
import { cleanValue, DependentItem, dependents, loadFn } from "./dependent.data";
import { DiAction } from "./di.actions";

export type EvaluateDiFn<S> = ( dis: DependentItem<S, any>[] ) => ( s: S ) => EvaluateDiRes<S>
export type EvaluateDiRes<S> = {
  actions: DiAction<S, any>[]
  status: UpstreamStatus
  vAndT: DiValuesAndTags
}

//true means it's dirty and in need of change, false means it's not changed, undefined means 'the upstream value is undefined'
export type UpstreamStatus = NameAnd<boolean | undefined>
export type DiValuesAndTags = NameAnd<ValueAndTagAndLastTag>

function makeDiAction<S, T> ( deps: DependentItem<S, any>[],
                              vAndT: NameAnd<ValueAndTagAndLastTag>,
                              di: DependentItem<S, T>, s: S, wantLoad: boolean,
                              currentTags: ValueAndTagAndLastTag[], reasonPrefix ): DiAction<S, T>[] {
  const params = deps.map ( d => vAndT[ d.name ].value );
  const value = cleanValue ( di, s, params )
  const tag = di.tagFn ( value )
  const clean = { value, tag }
  let thisVAndT = vAndT[ di.name ];
  const alreadyClean = clean.value === thisVAndT.value || clean.tag === thisVAndT.tag//Note the || We're OK if we have already cleaned. We can use the value (often a string or something) or the tag
  const load = wantLoad && di.dependsOn.load ? loadFn ( di.dependsOn, params ) : undefined
  if ( load ) return [ { type: 'fetch', clean, load, di, tags: currentTags, tag: thisVAndT.tag, reason: reasonPrefix + 'HaveLoadFn' } ];
  return alreadyClean ? [] : [ { type: 'clean', clean, di, reason: reasonPrefix + 'NoLoadFnButNeedToClean' } ];

}
export const evaluateDependentItem = <S> ( getTag: TagStoreGetter<S>, status: UpstreamStatus, vAndT: DiValuesAndTags, s: S ) => ( di: DependentItem<S, any> ): DiAction<S, any>[] => {
  const deps = dependents ( di.dependsOn )
  const currentTags = deps.map ( d => vAndT[ d.name ] )
  const someUpstreamIsUndefined = currentTags.some ( vt => vt?.value === undefined )
  const lastTags = currentTags.map ( vAndT => vAndT.lastTag )
  const upstreamChanged = lastTags.some ( ( ch, i ) => diTagChanged ( ch, currentTags[ i ].tag ) )

  const thisValue = di.optional.getOption ( s )
  const thisTag = di.tagFn ( thisValue )
  let lastTag = getTag ( s, di.name );
  vAndT[ di.name ] = { value: thisValue, tag: thisTag, lastTag: lastTag }

  const willClean = thisTag === undefined || upstreamChanged || someUpstreamIsUndefined;
  const reasonPrefix = thisTag === undefined ? 'thisTagUndefined' : upstreamChanged ? 'upStreamChanged' : someUpstreamIsUndefined ? 'someUpstreamIsUndefined' : 'noChange'
  status[ di.name ] = thisValue === undefined ? undefined : willClean

  const tagChanged = (diTagChanged ( lastTag, thisTag ))
  console.log ( 'tagChanged', di.name, tagChanged, lastTag, thisTag )
  if ( willClean ) return makeDiAction ( deps, vAndT, di, s, !someUpstreamIsUndefined, currentTags, reasonPrefix )
  return tagChanged ? [ { type: 'setTag', di, tag: thisTag } ] : []
};

export const evaluateAllDependentItems = <S> ( getTag: TagStoreGetter<S> ): EvaluateDiFn<S> => ( dis: DependentItem<S, any>[] ) => ( s: S ): EvaluateDiRes<S> => {
  const status: UpstreamStatus = {}
  const vAndT: DiValuesAndTags = {}
  const actions = dis.flatMap ( evaluateDependentItem ( getTag, status, vAndT, s ) )
  return { actions, status, vAndT }
};