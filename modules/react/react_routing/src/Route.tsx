import React from "react";
import { useRoute, useRouteVariables } from "./react_routing";
import { extractPathAndQuery } from "./extract.path.variable";

export function RouteDebug () {
  const path = useRoute ()[ 0 ]
  const pathQuery = extractPathAndQuery ( path )
  const vars = useRouteVariables ( pathQuery.path )
  return <pre>RouteDebug {JSON.stringify ( { route: path, pathQuery, vars}, null, 2 )}</pre>
}

export type RouteProps<T> = {
  path: string
  children: React.ReactNode
}
export function Route<T> ( { path, children }: RouteProps<T> ): React.ReactElement {
  const vars = useRouteVariables ( path )
  if ( vars === null ) return <></>
  return <>{children}</>
}

export type RouteVarsProps<T> = {
  path: string
  children: ( t: T ) => React.ReactNode
}
export function RouteVars<T> ( { path, children }: RouteVarsProps<T> ): React.ReactElement {
  const vars = useRouteVariables ( path )
  if ( vars === null ) return <></>
  return <>{children ( vars )}</>
}
