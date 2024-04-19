export type DiTag = undefined | string | string[]
export type DiTagFn<T> = ( t: T ) => DiTag
export type ValueAndTag = { value?: any, tag?: DiTag }
export type ValueAndTagAndLastTag = { value?: any, tag?: DiTag, lastTag?: DiTag }

export function tagToString ( h: DiTag ): string {
  if ( h === undefined ) return 'undefined'
  if ( typeof h === 'string' ) return h
  return JSON.stringify ( h )
}

export function diTagChanged ( oldValue: DiTag, newValue: DiTag ) {
  if ( oldValue === undefined ) return newValue !== undefined
  const t1 = typeof oldValue
  if ( t1 !== typeof newValue ) return true
  if ( t1 === 'string' ) return newValue !== oldValue
  const oldVA: string[] = oldValue as string[]
  const newVA: string[] = newValue as string[]
  if ( oldVA.length !== newVA.length ) return true
  for ( let i = 0; i < oldVA.length; i++ )
    if ( oldVA[ i ] !== newVA[ i ] ) return true
  return false;
}
