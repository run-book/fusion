import { Task, Tests } from "../state/fusion.state";
import { LensProps2 } from "@focuson/state";
import { RouteVars } from "@fusionconfig/react_routing";
import React from "react";
import { TestTable } from "./tests.view";
import { NameAnd } from "@laoban/utils";
import { ReqRespAction } from "../state/test.selection";


export type TestSummaryProps<S> = LensProps2<S, ReqRespAction, string, any> & { task?: Task, tests?: Tests }
export function TestSummary<S> ( { state, tests, task }: TestSummaryProps<S> ) {
  if ( task === undefined ) return <div>No task</div>
  if ( tests === undefined ) return <div>No tests</div>
  return <>
    Requests
    <TestTable state={state.state2 ()} inputs={tests.inputRequestTests} outputs={tests.outputRequestTests}/>
    Responses
    <TestTable state={state.state2 ()} inputs={tests.inputResponseTests} outputs={tests.outputResponseTests}/>
  </>

}

export type TestsDetailsPageProps<S> = LensProps2<S, ReqRespAction, string, any> & {
  tasks: NameAnd<Task>,
  tests?: Tests
}
export function TestsDetailsPage<S> ( { state, tasks, tests }: TestsDetailsPageProps<S> ) {
  return <RouteVars path='/task/{task}/Summary'>{( { task } ) =>
    <TestSummary task={tasks[ task ]} tests={tests} state={state}/>}</RouteVars>
}