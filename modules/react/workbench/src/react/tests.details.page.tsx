import { Task, Tests } from "../state/fusion.state";
import { LensProps2 } from "@focuson/state";
import { RouteVars } from "@fusionconfig/react_routing";
import React from "react";
import { TestTable } from "./tests.view";
import { NameAnd, value } from "@laoban/utils";
import { ReqRespAction } from "../state/test.selection";
import { RunTestsDefn } from "@fusionconfig/tests";
import { parseNamedUrlOrThrow } from "@itsmworkbench/urlstore/dist/src/identity.and.name.url";
import { ListNamesResult } from "@itsmworkbench/urlstore";


export type TestSummaryProps<S> = LensProps2<S, ReqRespAction, string, any> & { task?: Task, tests?: Tests }
export function TestSummary<S> ( { state, tests, task }: TestSummaryProps<S> ) {
  if ( task === undefined ) return <div>No task</div>
  if ( tests === undefined ) return <div>No tests</div>
  const request = { task: task.request.schema.name, service: task.request.kafka.name, tx: task.request.transformer.name }
  const response = { task: task.response.schema.name, service: task.response.kafka.name, tx: task.response.transformer.name }


  const requestTests: RunTestsDefn = {
    schema: { input: task.request.schema.name, output: task.request.kafka.name },
    transformer: task.request.transformer.name
  }

  return <>
    Data
    <pre>{JSON.stringify ( requestTests, null, 2 )}</pre>
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