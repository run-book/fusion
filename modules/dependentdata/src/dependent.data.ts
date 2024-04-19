import { Optional } from "@focuson/lens";
import { DiTagFn } from "./tag";

export interface DependentItem<S, T> {
  name: string
  tagFn: DiTagFn<T>
  optional: Optional<S, T>
  dependsOn: DependsOn<S, T>
}


export type PrimitiveCleanOperation = 'nuke' | 'leave'
export type CleanFn0<T> = () => T
export type CleanFn1<T, T1> = ( t: T1 ) => T
export type CleanFn2<T, T1, T2> = ( t1: T1, t2: T2 ) => T
export type CleanFn3<T, T1, T2, T3> = ( t1: T1, t2: T2, t3: T3 ) => T
export type CleanOperation<T> = PrimitiveCleanOperation | CleanFn0<T> | CleanFn1<T, any> | CleanFn2<T, any, any> | CleanFn3<T, any, any, any>

export type RootDepend<T> = {
  root: true
  load?: () => Promise<T>
  clean: PrimitiveCleanOperation | CleanFn0<T>
}
function isRootDepend<S, T> ( d: DependsOn<S, T> ): d is RootDepend<T> {
  return 'root' in d
}

export type DependsOn1<S, T, T1> = {
  dependentOn: DependentItem<S, T1>
  load?: ( p1: T1 ) => Promise<T>
  clean: PrimitiveCleanOperation | CleanFn1<T, T1>
}
function isDependsOn1<S, T, T1> ( d: DependsOn<S, T> ): d is DependsOn1<S, T, T1> {
  return 'dependentOn' in d
}
export type DependsOn2<S, T, T1, T2> = {
  dependentOn1: DependentItem<S, T1>
  dependentOn2: DependentItem<S, T2>
  load?: ( p1: T1, p2: T2 ) => Promise<T>
  clean: PrimitiveCleanOperation | CleanFn2<T, T1, T2>
}
function isDependsOn2<S, T, T1, T2> ( d: DependsOn<S, T> ): d is DependsOn2<S, T, any, any> {
  return 'dependentOn1' in d && 'dependentOn2' in d
}
export type DependsOn3<S, T, T1, T2, T3> = {
  dependentOn1: DependentItem<S, T1>
  dependentOn2: DependentItem<S, T2>
  dependentOn3: DependentItem<S, T3>
  load?: ( p1: T1, p2: T2, p: T3 ) => Promise<T>
  clean: PrimitiveCleanOperation | CleanFn3<T, T1, T2, T3>
}
function isDependsOn3<S, T, T1, T2, T3> ( d: DependsOn<S, T> ): d is DependsOn3<S, T, any, any, any> {
  return 'dependentOn3' in d && 'dependentOn2' in d && 'dependentOn1' in d
}
export type DependsOn<S, T> = DependsOn1<S, T, any> | DependsOn2<S, T, any, any> | DependsOn3<S, T, any, any, any> | RootDepend<T>
export function dependents<S, T> ( d: DependsOn<S, T> ): DependentItem<S, any>[] {
  if ( isDependsOn3<S, T, any, any, any> ( d ) ) return [ d.dependentOn1, d.dependentOn2, d.dependentOn3 ]
  if ( isDependsOn2<S, T, any, any> ( d ) ) return [ d.dependentOn1, d.dependentOn2 ]
  if ( isDependsOn1<S, T, any> ( d ) ) return [ d.dependentOn ]
  if ( isRootDepend<S, T> ( d ) ) return []
  throw new Error ( 'Unknown depends' + JSON.stringify ( d ) )
}
export function loadFn<S, T> ( d: DependsOn<S, T>, params: any[] ): () => Promise<T> | undefined {
  return () => {
    if ( isDependsOn3<S, T, any, any, any> ( d ) ) return d.load !== undefined && d.load ( params[ 0 ], params[ 1 ], params[ 2 ] )
    if ( isDependsOn2<S, T, any, any> ( d ) ) return d.load !== undefined && d.load ( params[ 0 ], params[ 1 ] )
    if ( isDependsOn1<S, T, any> ( d ) ) return d.load !== undefined && d.load ( params[ 0 ] )
    if ( isRootDepend<S, T> ( d ) ) return d.load !== undefined && d.load ()
    throw new Error ( 'Unknown depends' + JSON.stringify ( d ) )
  }
}

export function cleanValue<S, T> ( di: DependentItem<S, T>, s: S, params: any[] ): T {
  const d = di.dependsOn
  const clean = d.clean
  if ( clean === 'nuke' ) return undefined as any
  if ( clean === 'leave' ) return di.optional.getOption ( s )
  if ( typeof d.clean === 'function' ) {
    if ( isDependsOn3<S, T, any, any, any> ( d ) ) return d.clean ( params[ 0 ], params[ 1 ], params[ 2 ] )
    if ( isDependsOn2<S, T, any, any> ( d ) ) return d.clean ( params[ 0 ], params[ 1 ] )
    if ( isDependsOn1<S, T, any> ( d ) ) return d.clean ( params[ 0 ] )
    if ( isRootDepend<S, T> ( d ) ) return d.clean ()
  }
  throw new Error ( 'Unknown clean' + JSON.stringify ( di ) )
}

