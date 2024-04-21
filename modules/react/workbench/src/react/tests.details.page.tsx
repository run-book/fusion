import { Task } from "../state/fusion.state";
import { LensProps2 } from "@focuson/state";
import { RouteVars } from "@fusionconfig/react_routing";
import React from "react";
import { ErrorsAnd, hasErrors, NameAnd } from "@laoban/utils";
import { ReqRespAction } from "../state/test.selection";
import { TestsResult } from "@fusionconfig/tests";
import { TestTable } from "./tests.view";


export type TestSummaryProps<S> = LensProps2<S, ReqRespAction, string, any> & { taskName: string,task?: Task, testResult: ErrorsAnd<TestsResult> | undefined }
export function TestSummary<S> ( { state, taskName, testResult, task }: TestSummaryProps<S> ) {
  if ( task === undefined ) return <div>No task</div>
  if ( testResult === undefined ) return <div>No tests</div>

  if ( hasErrors ( testResult ) ) return <pre>{JSON.stringify ( testResult, null, 2 )}</pre>
  return <>
    Request {taskName} ===&gt; {task.service}. I/P samples in {task.request.schema.name}. O/P samples in {task.request.kafka.name}
    <TestTable tests={testResult.tests}/>
    Response {taskName} &lt;=== {task.service}. I/P samples in {task.response.kafka.name}. O/P samples in {task.response.schema.name}
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

