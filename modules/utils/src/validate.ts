import { flatMap } from "@laoban/utils";

export type Validate<T> = ( context: string, t: T ) => string[];
export const validateExists = <T, K extends keyof T> ( key: K ): Validate<T> =>
  ( context, t ) =>
    t?.[ key ] === undefined || t?.[ key ] === null ?
      [ `${context}: Property '${String ( key )}' does not exist.` ]
      : [];
export const validateChild = <T, K extends keyof T> ( key: K, validate: Validate<T[ K ]> ): Validate<T> =>
  ( context, t ) => validate ( `${context}.${key.toString()}`, t[ key ] as T[ K ] );

export const validateif = <T> ( check: ( t: T ) => boolean, msg: string ): Validate<T> =>
  ( context: string, t: T, ): string[] =>
    check ( t ) ? [] : [ `${context}: ${msg}` ]

export const validateIfNot = <T> ( check: ( t: T ) => boolean, msg: string ): Validate<T> =>
  ( context: string, t: T, ): string[] =>
    check ( t ) ? [ `${context}: ${msg}` ] : []

export const compose = <T> ( ...validators: Validate<T>[] ): Validate<T> =>
  ( context, t ) =>
    flatMap ( validators, ( validator ) => validator ( context, t ) );