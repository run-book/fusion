import { FusionWorkbenchState, Task, taskL } from "../state/fusion.state";
import { LensProps } from "@focuson/state";
import { CardWithTitleAndBody, ResponsiveSelectableGrid } from "@fusionconfig/react_components";
import { splitAndCapitalize } from "@itsmworkbench/utils";
import { Toolbar, Typography } from "@mui/material";
import React from "react";
import { MultiParagraphText } from "@fusionconfig/i18n";

export type TaskOnHomePageProps = { taskName: string, task: Task }
export function TaskOnHomePage ( { taskName, task }: TaskOnHomePageProps ) {
  return <>
    <Typography>Name: {taskName}</Typography>
    <Typography>{task.taskDescription}</Typography>
    <hr/>
    <Typography variant="subtitle1">Kafka Topic: {task.request.topic}</Typography>
    <Typography>{task.serviceDescription}</Typography>
  </>

}
export function TaskOnHomeCardPage ( { taskName, task }: TaskOnHomePageProps ) {
  return <CardWithTitleAndBody title={splitAndCapitalize ( taskName )} comp={<TaskOnHomePage task={task} taskName={taskName}/>}/>
}

export function HomePage<S> ( { state }: LensProps<S, FusionWorkbenchState, any> ) {
  const s = state.optJson ()
  const items = s?.config?.tasks || {}
  return <>
    <ResponsiveSelectableGrid state={state.chainLens ( taskL )} items={items} children={( name, task ) => <TaskOnHomeCardPage taskName={name} task={task}/>}/>
    <Toolbar />
    <CardWithTitleAndBody title='' comp={<MultiParagraphText i18nKey={[ "fusion.home.description" ]}/>}/>
  </>
}