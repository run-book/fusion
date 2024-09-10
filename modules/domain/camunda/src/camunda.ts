import { DateTimeService } from "@itsmworkbench/utils";
import { NameAnd } from "@laoban/utils";
import { Authentication, defaultAuthFn, FetchFn } from "@fusionconfig/auth";


export type CamundaDefn = {
  baseurl: string
  auth: Authentication
}

export type CamundaFetch = <T>( camunda: CamundaDefn, url: string, debug?: boolean ) => Promise<T>
export function camundaFetch ( fetchFn: FetchFn, env: NameAnd<string | undefined> ): CamundaFetch {
  const authFn = defaultAuthFn ( env, fetchFn, DateTimeService, {} )
  return async ( camunda: CamundaDefn, url: string, debug ) => {
    const auth = camunda.auth;
    const headers = await authFn ( auth );
    const options = { headers }
    if ( debug ) console.log ( 'fetching', camunda.baseurl + url )
    const resp = await fetchFn ( camunda.baseurl + url, options )
    if ( !resp.ok ) throw new Error ( `Error fetching ${url}: ${resp.statusText} ${await resp.text ()}` )
    return await resp.json ()
  }
}

export type CamundaProcessDefn = {
  id: string
  key: string
  category: string
  description: string | null
  name: string
  version: number
  resource: string
  deploymentId: string
  diagram: string | null
  suspended: boolean
  tenantId: string | null
  versionTag: string | null
  historyTimeToLive: number | null
  startableInTasklist: boolean
}
export async function processDefns ( camundaFetch: CamundaFetch, defn: CamundaDefn, debug?: boolean ): Promise<CamundaProcessDefn[]> {
  return camundaFetch<CamundaProcessDefn[]> ( defn, '/process-definition', debug )
}

export type HistoricProcessInstance = {
  id: string
  businessKey: string | null
  processDefinitionId: string
  processDefinitionKey: string
  processDefinitionName: string
  processDefinitionVersion: number
  startTime: string
  endTime: string | null
  removalTime: string | null
  durationInMillis: number | null
  startUserId: string | null
  startActivityId: string
  deleteReason: string | null
  rootProcessInstanceId: string
  superProcessInstanceId: string | null
  superCaseInstanceId: string | null
  caseInstanceId: string | null
  tenantId: string | null
  state: string
}
export function historicProcesses ( camundaFetch: CamundaFetch, defn: CamundaDefn, debug?: boolean ) {
  return camundaFetch<HistoricProcessInstance[]> ( defn, '/history/process-instance', debug )
}

export function externalTasks ( camundaFetch: CamundaFetch, defn: CamundaDefn, id: string, debug?: boolean ) {
  return camundaFetch<any> ( defn, `/external-task?processInstanceId=${encodeURIComponent ( id )}`, debug )
}

export function variablesForTask ( camundaFetch: CamundaFetch, defn: CamundaDefn, id: string, debug?: boolean ) {
  return camundaFetch<any> ( defn, `/execution/${id}/localVariables `, debug )
}