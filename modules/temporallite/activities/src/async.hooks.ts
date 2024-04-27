import { AsyncLocalStorage } from "async_hooks";
import { ReplayState } from "./replay.state";
import { IncMetric } from "./metrics";
import { NameAnd } from "@laoban/utils";
import { LogLevel, LogLevelValue } from "./log";
import { simpleTemplate } from "@fusionconfig/utils";
import { derefence, dollarsBracesVarDefn } from "@laoban/variables";
import { parensVariableDefn } from "@laoban/variables/dist/src/variables";

export type MetricHookState = {
  incMetric: IncMetric
}
export type WorkspaceHookState = MetricHookState & {
  workflowId: string
  workflowInstanceId: string
  replayState: ReplayState
  currentReplayIndex: number
  updateCache: ( activityId: string, t: any ) => void,
  updateCacheWithError: ( activityId: string, error: any ) => Promise<void>
}

export const workspaceHookState = new AsyncLocalStorage<WorkspaceHookState> ()

export function useWorkspaceHookState (): WorkspaceHookState {
  return workspaceHookState.getStore ()
}
export function useMetricHookState (): IncMetric {
  return workspaceHookState.getStore ().incMetric
}

export type LogFn = ( level: LogLevel, key: string ) => void
export const consoleLog: LogFn = ( level, message ) => console.log ( level, message )
export type LoggingHookState = {
  timeService?: () => number
  correlationId?: string
  commonLogMessage?: NameAnd<string>
  mainTemplate?: string  // defaults to {time} {level} [CorrelationId: {correlationId}] {message} or {time} {level} {message} if the correlation id isn't there
  params?: NameAnd<any>
  globalLogLevel?: LogLevel
  log?: LogFn// defaults to console.log if not present
}
export const loggingHookState = new AsyncLocalStorage<Required<LoggingHookState>> ()

export function cleanLoggingHookState ( l: LoggingHookState ): Required<LoggingHookState> {
  return {
    timeService: l.timeService || Date.now,
    correlationId: l.correlationId || '',
    commonLogMessage: l.commonLogMessage || {},
    globalLogLevel: l.globalLogLevel || 'INFO',
    mainTemplate: l.mainTemplate || (l.correlationId && l.correlationId !== '' ? '{time} {level} [CorrelationId: {correlationId}] {message}' : '{time} {level} {message}'),
    params: l.params || {},
    log: l.log || consoleLog
  }
}

export function useLogging ( messages?: NameAnd<string>, dictionary?: NameAnd<any> ): LogFn {
  const safeDictionary = dictionary || {}
  const state = loggingHookState.getStore ()
  if ( state === undefined ) throw new Error ( 'Software error: logging hook state not set' )
  const global = LogLevelValue[ state.globalLogLevel ]
  return ( level, rawMessage ) => {
    if ( LogLevelValue[ level ] < global ) return
    const { log, correlationId, params, mainTemplate, timeService, commonLogMessage, globalLogLevel } = state;
    const allMessages = { ...commonLogMessage, ...(messages || {}) }
    let messageTemplate = allMessages[ rawMessage ] ? allMessages[ rawMessage ] : rawMessage;
    const time = timeService ()
    const fullDictionary = { ...params, ...safeDictionary, correlationId, time, message: rawMessage, level, }
    const message = derefence ( 'useLogging', fullDictionary, messageTemplate, { variableDefn: parensVariableDefn, allowUndefined: true } )
    const fullMessage = simpleTemplate ( mainTemplate, { correlationId, time, message, level } )
    log ( level, fullMessage )
  }
}
