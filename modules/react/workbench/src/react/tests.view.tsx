import { LensProps } from "@focuson/state";
import React from "react";
import { ErrorsAnd, hasErrors } from "@laoban/utils";
import { ListNamesResult } from "@itsmworkbench/urlstore";
import { DataTable } from "@fusionconfig/react_components";


export type TestTableProps<S> = LensProps<S, string, any> & {
  inputs: ErrorsAnd<ListNamesResult>
  outputs: ErrorsAnd<ListNamesResult>
}
export function TestTable<S> ( { state, inputs, outputs }: TestTableProps<S> ) {
  if ( !inputs ) return <div>No tests</div>
  if ( hasErrors ( inputs ) ) return <pre>Errors in inputs{'\n'}{inputs.join ( '\n' )}</pre>
  if ( hasErrors ( outputs ) ) return <pre>Errors in outputs{'\n'}{outputs.join ( '\n' )}</pre>

  return <DataTable cols={[ 'name', 'i/p schema', 'transform', 'o/p schema' ]} noData={<div>No tests</div>} rows={
    inputs.names.map ( name => {
      const outputExists = outputs.names?.includes ( name )
      return [ name, 'true', 'tx', outputExists ? 'true' : 'missing' ]
    } )}/>

}

export type TestStatusProps<S> = LensProps<S, string, any>

export function TestStatus<S> ( { state }: TestStatusProps<S> ) {

}