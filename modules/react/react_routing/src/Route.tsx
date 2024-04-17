import React from "react";
import { useRoute, useRouteVariables } from "./react_routing";

export function RouteDebug () {
  const route = useRoute ()[ 0 ]
  return <div>{route}</div>

}

export type RouteProps<T> = {
  path: string
  children: React.ReactNode
}
export function Route<T> ( { path, children }: RouteProps<T> ): React.ReactNode {
  const vars = useRouteVariables ( path )
  if ( vars === null ) return <></>
  return children
}
export type RouteVarsProps<T> = {
  path: string
  children: ( t: T ) => React.ReactNode
}
export function RouteVars<T> ( { path, children }: RouteVarsProps<T> ): React.ReactNode {
  const vars = useRouteVariables ( path )
  if ( vars === null ) return <></>
  return children ( vars )
}
