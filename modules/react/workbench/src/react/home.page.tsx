import { FusionWorkbenchState, rawConfigL, Task, taskL } from "../state/fusion.state";
import { LensProps } from "@focuson/state";
import { CardWithTitleAndBody, ResponsiveSelectableGridSize2, ResponsiveSelectableGridSize4 } from "@fusionconfig/react_components";
import { splitAndCapitalize } from "@itsmworkbench/utils";
import { Grid, Paper, Toolbar, Typography } from "@mui/material";
import React from "react";
import { MultiParagraphText } from "@fusionconfig/i18n";
import { FilesDetails, findLines } from "./files.details";

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
  const { foundLines, notFoundLines } = findLines ( state.chainLens ( rawConfigL ).optJson () )
  return <>
    <ResponsiveSelectableGridSize4 state={state.chainLens ( taskL )} items={items} children={( name, task ) => <TaskOnHomeCardPage taskName={name} task={task}/>}/>
    <Toolbar/>
    <CardWithTitleAndBody title='What you can see' sx={{ height: undefined }} comp={<MultiParagraphText i18nKey={[ "fusion.home.description" ]}/>}/>
    <Toolbar/>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={6}>
        <CardWithTitleAndBody title='Files used to define the config' comp={
          <>{foundLines.map ( ( l, i ) => <Typography style={{ wordWrap: 'break-word' }} key={i}>{l}</Typography> )}</>}/>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <CardWithTitleAndBody title={`Files that could be used to define the config, but don't exist`} comp={
          <>{notFoundLines.map ( ( l, i ) => <Typography style={{ wordWrap: 'break-word' }} key={i}>{l}</Typography> )}</>}/>
      </Grid>
    </Grid>

  </>
}