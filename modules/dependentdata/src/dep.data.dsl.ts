// Overload for root dependency (no dependencies)
import { CleanFn0, CleanFn1, CleanFn2, CleanFn3, DependentItem, PrimitiveCleanOperation } from "./dependent.data";
import { Optional } from "@focuson/lens";
import { DiTag } from "./tag";

export interface CommondConfigOptions<T> {
  tag?: ( t: T ) => DiTag
}
export interface DepDataConfigOptions0<T> extends CommondConfigOptions<T> {
  clean: PrimitiveCleanOperation | CleanFn0<T>
  load?: () => Promise<T>
}
export interface DepDataConfigOptions1<T, T1> extends CommondConfigOptions<T> {
  clean: PrimitiveCleanOperation | CleanFn1<T, T1>
  load?: ( t: T1 ) => Promise<T>
}
export interface DepDataConfigOptions2<T, T1, T2> extends CommondConfigOptions<T> {
  clean: PrimitiveCleanOperation | CleanFn2<T, T1, T2>
  load?: ( t1: T1, t2: T2 ) => Promise<T>
}
export interface DepDataConfigOptions3<T, T1, T2, T3> extends CommondConfigOptions<T> {
  clean: PrimitiveCleanOperation | CleanFn3<T, T1, T2, T3>
  load?: ( t1: T1, t2: T2, t3: T3 ) => Promise<T>
}
export function defaultTag<T> ( t: T ): DiTag {
  if ( t === undefined ) return undefined
  if ( typeof t === 'string' ) return t
  if ( Array.isArray ( t ) ) return t as string[]
  return JSON.stringify ( t )
}

export function depData<S, T> ( name: string, opt: Optional<S, T>, config: DepDataConfigOptions0<T> ): DependentItem<S, T>;
export function depData<S, T, T1> ( name: string, opt: Optional<S, T>, depends1: DependentItem<S, T1>, config: DepDataConfigOptions1<T, T1> ): DependentItem<S, T>;
export function depData<S, T, T1, T2> ( name: string, opt: Optional<S, T>, depends1: DependentItem<S, T1>, depends2: DependentItem<S, T2>, config: DepDataConfigOptions2<T, T1, T2> ): DependentItem<S, T>;
export function depData<S, T, T1, T2, T3> ( name: string, opt: Optional<S, T>, depends1: DependentItem<S, T1>, depends2: DependentItem<S, T2>, depends3: DependentItem<S, T3>, config: DepDataConfigOptions3<T, T1, T2, T3> ): DependentItem<S, T>;

export function depData<S, T, T1, T2, T3> ( name: string, optional: Optional<S, T>,
                                            a: DepDataConfigOptions0<T> | DependentItem<S, T1>,
                                            b?: DepDataConfigOptions1<T, T1> | DependentItem<S, T2>,
                                            c?: DepDataConfigOptions2<T, T1, T2> | DependentItem<S, T3>,
                                            d?: DepDataConfigOptions3<T, T1, T2, T3> ): DependentItem<S, T> {
  if ( arguments.length === 3 ) return depData0Impl ( name, optional, a as DepDataConfigOptions0<T> )
  else if ( arguments.length === 4 ) return depData1Impl ( name, optional, a as DependentItem<S, T1>, b as DepDataConfigOptions1<T, T1> );
  else if ( arguments.length === 5 ) return depData2Impl ( name, optional, a as DependentItem<S, T1>, b as DependentItem<S, T2>, c as DepDataConfigOptions2<T, T1, T2> );
  else if ( arguments.length === 6 ) return depData3Impl ( name, optional, a as DependentItem<S, T1>, b as DependentItem<S, T2>, c as DependentItem<S, T3>, d as DepDataConfigOptions3<T, T1, T2, T3> );
  throw new Error ( "Invalid number of arguments for depData function" );
}

export function depData0Impl<S, T> ( name: string, optional: Optional<S, T>, config: DepDataConfigOptions0<T> ): DependentItem<S, T> {
  return {
    name,
    tagFn: config.tag || defaultTag,
    optional,
    dependsOn: { root: true, clean: config.clean, load: config.load }
  }
}
// Handling 1 dependency
function depData1Impl<S, T, T1> (
  name: string,
  optional: Optional<S, T>,
  depends1: DependentItem<S, T1>,
  config: DepDataConfigOptions1<T, T1>
): DependentItem<S, T> {
  return {
    name,
    tagFn: config.tag || defaultTag,
    optional,
    dependsOn: {
      dependentOn: depends1,
      clean: config.clean,
      load: config.load
    },
  };
}

// Handling 2 dependencies
function depData2Impl<S, T, T1, T2> (
  name: string,
  optional: Optional<S, T>,
  depends1: DependentItem<S, T1>,
  depends2: DependentItem<S, T2>,
  config: DepDataConfigOptions2<T, T1, T2>
): DependentItem<S, T> {
  return {
    name,
    tagFn: config.tag || defaultTag,
    optional,
    dependsOn: {
      dependentOn1: depends1,
      dependentOn2: depends2,
      clean: config.clean,
      load: config.load
    },
  };
}

// Handling 3 dependencies
function depData3Impl<S, T, T1, T2, T3> (
  name: string,
  optional: Optional<S, T>,
  depends1: DependentItem<S, T1>,
  depends2: DependentItem<S, T2>,
  depends3: DependentItem<S, T3>,
  config: DepDataConfigOptions3<T, T1, T2, T3>
): DependentItem<S, T> {
  return {
    name,
    tagFn: config.tag || defaultTag,
    optional,
    dependsOn: {
      dependentOn1: depends1,
      dependentOn2: depends2,
      dependentOn3: depends3,
      clean: config.clean,
      load: config.load
    },
  };
}


