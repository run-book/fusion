import { Optional } from "@focuson/lens";
import React, { useContext } from "react";
import { LensProps, LensState } from "@focuson/state";
import { extractPathVariables } from "./extract.path.variable";


export interface RouteProviderProps<S> extends LensProps<S, string, any> {
  children: React.ReactNode;
}
export const RouteContext = React.createContext<LensState<any, string, any> | undefined> ( undefined );

//Uses the state to make use the url is updated
export function RouteProvider<S> ( { children, state }: RouteProviderProps<S> ) {
  const route = state.optJson () || '/'
  if ( route !== window.location.pathname ) window.history.pushState ( {}, '', route )
  return <RouteContext.Provider value={state}> {children} </RouteContext.Provider>;
}
export function useRouteState<S> (): LensState<S, string, any> {
  const state = useContext ( RouteContext );
  if ( state === undefined ) {
    throw new Error ( "useRouteState must be used within a RouteContext" );
  }
  return state as LensState<S, string, any>;
}

export function useRoute<S> (): [ string, ( s: string ) => void ] {
  const state = useRouteState ();
  return [ state.optJson () || '/', s => state.setJson ( s, 'useRoute' ) ];
}

export function useRouteVariables<S> ( pattern: string ) {
  const context = useRouteState ()
  const route = context.optJsonOr ( '/' )
  const result = extractPathVariables ( pattern, route );
  return result
}

