import { ReqRespTx, requestTranform, responseTransform, serviceRequestInput, serviceResponseOutput, Task, taskRequestInput, taskResponseOutput, Tests } from "../state/fusion.state";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { CardWithTitleAndBody } from "@fusionconfig/react_components/src/layout/responsive.two.column.cards";
import { schemaToTestQuery, TaskProps, TaskSummaryPageProps } from "./task.summary.page";
import { RequestOrResponse } from "@fusionconfig/sample";
import { NameAnd, toArray } from "@laoban/utils";
import { MultiParagraphText } from "@fusionconfig/i18n";
import { FocusOnSetValueButton } from "@fusionconfig/react_components";
import { LensProps, LensProps2, LensProps3 } from "@focuson/state";

export type TaskDetailsLayoutProps = {
  task: React.ReactElement
  request: React.ReactElement
  response: React.ReactElement
  service: React.ReactElement
}

export const TaskDetailsLayout: React.FC<TaskDetailsLayoutProps> = ( { task, request, response, service } ) => {
  return (
    <Grid container spacing={2}>
      {/* Task on the left */}
      <Grid item xs={12} sm={4}>
        <CardWithTitleAndBody title='Task' comp={task}/>
      </Grid>

      {/* Request and Response in the middle */}
      <Grid item xs={12} sm={4} container direction="column">
        <Grid container>
          <Grid item xs={12}>
            <CardWithTitleAndBody title='===Request===>' comp={request} sx={{ margin: '30px' }}/>
          </Grid>
          <Grid item xs={12}>
            <CardWithTitleAndBody title='<===Response===' comp={response} sx={{ margin: '30px' }}/>
          </Grid>
        </Grid>
      </Grid>

      {/* Service on the right */}
      <Grid item xs={12} sm={4}>
        <CardWithTitleAndBody title='Service' comp={service}/>
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
export type ReqOrRespSummaryProps<S> = LensProps<S, ReqRespTx,any>
export function RequestSummary<S> ( { state }: ReqOrRespSummaryProps<S> ) {
  return <Stack spacing={2} sx={{ padding: 2 }}> {/* Adjust spacing and padding as needed */}
    <FocusOnSetValueButton title='Task Input Schema' valueToSet={taskRequestInput} state={state}/>
    <FocusOnSetValueButton title='Transformer' valueToSet={requestTranform} state={state}/>
    <FocusOnSetValueButton title='Service Input Schema' valueToSet={serviceRequestInput} state={state}/>
  </Stack>
}
export function ResponseSummary<S> ( { state }: ReqOrRespSummaryProps<S> ) {
  return <Stack spacing={2} sx={{ padding: 2 }}> {/* Adjust spacing and padding as needed */}
    <FocusOnSetValueButton title='Service Output Schema' valueToSet={serviceResponseOutput} state={state}/>
    <FocusOnSetValueButton title='Transformer' valueToSet={responseTransform} state={state}/>
    <FocusOnSetValueButton title='Task output Schema' valueToSet={taskResponseOutput} state={state}/>
  </Stack>
}
export type TaskDetailsPageProps<S> = LensProps3<S, Tests, NameAnd<Task>,ReqRespTx ,any> & { task: string | undefined }
export function TaskDetailsPage<S> ( { state, task }: TaskDetailsPageProps<S> ) {
  const data: Task = (state.optJson2 () || {})[ task || '' ]
  if ( data === undefined ) return <Paper style={{ padding: 20 }}/>
  return <Paper style={{ padding: 20 }}>
    <TaskDetailsLayout task={<TaskDetails task={data} taskName={task}/>}
                       request={<RequestSummary state={state.state3()}/>}
                       response={<ResponseSummary state={state.state3()}/>}
                       service={<ServiceDetails data={data}/>}/>

  </Paper>
}
