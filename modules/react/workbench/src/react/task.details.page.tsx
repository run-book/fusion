import { ReqRespTx, requestTranform, responseTransform, serviceRequestInput, serviceResponseOutput, summary, Task, taskRequestInput, taskResponseOutput, Tests } from "../state/fusion.state";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { CardWithTitleAndBody } from "@fusionconfig/react_components/src/layout/responsive.two.column.cards";
import { TaskProps } from "./task.summary.page";
import { NameAnd, toArray } from "@laoban/utils";
import { MultiParagraphText } from "@fusionconfig/i18n";
import { FocusOnSetValueButton } from "@fusionconfig/react_components";
import { LensProps, LensProps3 } from "@focuson/state";
import { TestsDetailsPage } from "./tests.details.page";

export type TaskDetailsLayoutProps = {
  task: React.ReactElement
  requestResponse: React.ReactElement
  service: React.ReactElement
  tests: React.ReactElement
}

export const TaskDetailsLayout: React.FC<TaskDetailsLayoutProps> = ( { task, requestResponse, service, tests } ) => {
  return (
    <Grid container spacing={2}>
      {/* Task on the left */}
      <Grid item xs={12} sm={4}>
        <CardWithTitleAndBody title='Task' comp={task}/>
      </Grid>

      {/* Request and Response in the middle, centered vertically */}
      <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <CardWithTitleAndBody title='' comp={requestResponse} sx={{ margin: '10px' }}/>
      </Grid>

      {/* Service on the right */}
      <Grid item xs={12} sm={4}>
        <CardWithTitleAndBody title='Service' comp={service}/>
      </Grid>
      <Grid item xs={12} sm={12}>
        <CardWithTitleAndBody title='Tests' comp={tests}/>
      </Grid>
    </Grid>
  );
};

export type TaskDetailsProps = { taskName: string | undefined, task: Task }
export function TaskDetails ( { taskName, task }: TaskDetailsProps ) {
  return <Typography variant="body1" paragraph>
    <MultiParagraphText i18nKey={[ "fusion.task.description" ]}/>
    <hr/>
    <Typography>Name: {taskName} </Typography>
    <Typography>{task.taskDescription} </Typography>
    <Typography>Variables: {toArray ( task.variables ).join ( ', ' )}</Typography>
  </Typography>
}

export function ServiceDetails ( { data }: TaskProps ) {
  return <>
    <MultiParagraphText i18nKey={[ "fusion.service.description" ]}/>
    <hr/>
    <Typography variant="h6">{data.service}</Typography>
    <Typography variant="subtitle1">{data.serviceDescription}</Typography>
  </>
}
export type ReqOrRespSummaryProps<S> = LensProps<S, ReqRespTx, any>
let fontSize = '0.5rem';
export function RequestSummary<S> ( { state }: ReqOrRespSummaryProps<S> ) {
  return <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'space-around', padding: 1, }}> {/* Adjust spacing and padding as needed */}
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Task Input Schema' valueToSet={taskRequestInput} state={state}/>
    &gt;
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Transform' valueToSet={requestTranform} state={state}/>
    &gt;
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Service Input Schema' valueToSet={serviceRequestInput} state={state}/>
    &gt;
  </Stack>
}
export function ResponseSummary<S> ( { state }: ReqOrRespSummaryProps<S> ) {
  return <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'space-around', padding: 1 }}> {/* Adjust spacing and padding as needed */}
    &lt;
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Service Output Schema' valueToSet={serviceResponseOutput} state={state}/>
    &lt;
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Transform' valueToSet={responseTransform} state={state}/>
    &lt;
    <FocusOnSetValueButton size='small' sx={{ fontSize }} title='Task output Schema' valueToSet={taskResponseOutput} state={state}/>
  </Stack>
}
export function RequestResponse<S> ( { state }: ReqOrRespSummaryProps<S> ) {
  return <Stack direction='column' spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'space-around', padding: 1 }}>
    <FocusOnSetValueButton size='small' sx={{ fontSize, width: '10rem' }} title='Summary' valueToSet={summary} state={state}/>
    <RequestSummary state={state}/>
    <ResponseSummary state={state}/>
  </Stack>

}
export type TaskDetailsPageProps<S> = LensProps3<S, Tests, NameAnd<Task>, ReqRespTx, any> & { task: string | undefined }
export function TaskDetailsPage<S> ( { state, task }: TaskDetailsPageProps<S> ) {
  const data: Task = (state.optJson2 () || {})[ task || '' ]
  if ( data === undefined ) return <Paper style={{ padding: 20 }}/>
  return <Paper style={{ padding: 20 }}>
    <TaskDetailsLayout task={<TaskDetails task={data} taskName={task}/>}
                       requestResponse={<RequestResponse state={state.state3 ()}/>}
                       service={<ServiceDetails data={data}/>}
                       tests={<TestsDetailsPage state={state.state13 ()}/>}
    />

  </Paper>
}
