import { LensProps } from "@focuson/state";
import React from "react";
import { hasErrors, lastSegment } from "@laoban/utils";
import { DataTable } from "@fusionconfig/react_components";
import { isCannotRunTestResult, OneTestResult, SchemaTestResult } from "@fusionconfig/tests";


export type TestTableProps<S> = {
  tests: OneTestResult[]
}
export function TestTable<S> ( { tests }: TestTableProps<S> ) {
  if ( !tests ) return <div>No tests</div>
  const cols = [ 'name', 'i/p schema', 'transform', 'o/p schema' ]
  const rows = tests.map ( ( test: OneTestResult, i ) => {
    if ( isCannotRunTestResult ( test ) ) return [ test.errors.join ( ', ' ) ]
    const inpName = test.input?.name?.name;
    const outName = test.expectedOutput?.name?.name;
    function findStringFor ( result: SchemaTestResult | undefined ) {
      if ( !result ) return 'missing'
      if ( result.length > 0 ) return `failed ${result.length}`
      return 'passed'
    }
    return [ lastSegment(inpName || outName||'error'), findStringFor ( test.input?.result ), 'tx', findStringFor ( test.expectedOutput?.result ) ]
  } )

  return <DataTable cols={cols} noData={<div>No tests</div>} rows={rows}/>

}

export type TestStatusProps<S> = LensProps<S, string, any>

export function TestStatus<S> ( { state }: TestStatusProps<S> ) {

}