import { Task } from "../state/fusion.state";
import { Paper } from "@mui/material";
import React from "react";
import { ResponseTwoColumnCards } from "@fusionconfig/react_components/src/layout/responsive.two.column.cards";
import { RequestSummary, ResponseSummary, ServiceSummary, TaskSummary, TaskSummaryPageProps } from "./task.summary.page";

export function TaskDetailsPage<S> ( { state, task, singleColumn }: TaskSummaryPageProps<S> ) {
  const data: Task = (state.optJson () || {})[ task || '' ]
  if ( data === undefined ) return <Paper style={{ padding: 20 }}/>
  return <Paper style={{ padding: 20 }}>
    <ResponseTwoColumnCards singleColumn={singleColumn} cards={[
      { title: 'Task', component: <TaskSummary task={task} data={data}/> },
      { title: 'Service', component: <ServiceSummary data={data}/> },
    ]}/>
  </Paper>
}
