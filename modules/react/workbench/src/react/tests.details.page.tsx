import { Task } from "../state/fusion.state";
import { LensProps2 } from "@focuson/state";
import { RouteVars } from "@fusionconfig/react_routing";
import React from "react";
import { ErrorsAnd, hasErrors, NameAnd } from "@laoban/utils";
import { ReqRespAction } from "../state/test.selection";
import { TestsResult } from "@fusionconfig/tests";
import { TestTable } from "./tests.view";
import { Typography } from "@mui/material";

export function trimName(name: string){
  return name.substring(5)
}

export type TestSummaryProps<S> = LensProps2<S, ReqRespAction, string, any> & { taskName: string, task?: Task, testResult: ErrorsAnd<TestsResult> | undefined }
export function TestSummary<S> ( { state, taskName, testResult, task }: TestSummaryProps<S> ) {
  if ( task === undefined ) return <div>No task</div>
  if ( testResult === undefined ) return <div>No tests</div>

  if ( hasErrors ( testResult ) ) return <pre>{JSON.stringify ( testResult, null, 2 )}</pre>
  return <>
    <Typography>Request: {taskName} ({trimName(task.request.schema.name)}) ===&gt; {task.service} ({trimName(task.request.kafka.name)}).</Typography>
    <TestTable tests={testResult.tests}/>
    <Typography>Response: {taskName} ({trimName(task.response.schema.name)}) &lt;=== {task.service} ({trimName(task.response.kafka.name)}).</Typography>
    <TestTable tests={testResult.tests}/>
    {/*<pre>{JSON.stringify ( testResult, null, 2 )}</pre>*/}

  </>

}

export type TestsDetailsPageProps<S> = LensProps2<S, ReqRespAction, string, any> & {
  tasks: NameAnd<Task>,
  testResult: ErrorsAnd<TestsResult> | undefined
}
export function TestsDetailsPage<S> ( { state, tasks, testResult }: TestsDetailsPageProps<S> ) {
  return <RouteVars path='/task/{task}/Summary'>{( { task } ) =>
    <TestSummary task={tasks[ task ]} taskName={task} testResult={testResult} state={state}/>}</RouteVars>
}

