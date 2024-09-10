import { CommandDetails, ContextConfigAndCommander, SubCommandDetails } from "@itsmworkbench/cli";
import { ThereAndBackContext } from "./context";
import { processDefns, CamundaDefn, historicProcesses, externalTasks, variablesForTask } from "@fusionconfig/camunda";
import { fromOpts } from "./config.commands";
import { loadAndMergeAndYamlParts, PostProcessor } from "@fusionconfig/config";
import { hasErrors, NameAnd, toArray } from "@laoban/utils";

async function fetchCamundaDetails<Commander, Config, CleanConfig> ( opts: NameAnd<string | boolean | string[]>, tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ) {
  const { params, file, parent, full, debug } = fromOpts ( opts );
  const postProcessors: PostProcessor[] = []

  let { fileDetails, errors, postProcessorErrors, sorted, yaml } =
        await loadAndMergeAndYamlParts ( tc.context.loadFiles, postProcessors, tc.context.commentFactoryFn ( 1 ), params, parent, file, opts.debug === true );
  if ( errors.length > 0 || toArray ( postProcessorErrors ).length > 0 ) {
    toArray ( postProcessorErrors )?.length > 0 && console.log ( 'Post Processor Errors', postProcessorErrors )
    errors?.length > 0 && console.log ( 'Errors', errors )
    process.exit ( 1 )
  }

  const json = tc.context.yaml.parser ( yaml || '{}' )
  if ( hasErrors ( json ) ) {
    console.log ( 'YAML Errors', json )
    process.exit ( 1 )
  }
  const camunda: CamundaDefn = json.camunda
  if ( !camunda ) {
    console.log ( 'No camunda definition in yaml' )
    process.exit ( 1 )
  }
  return { full, debug, camunda };
}
export function processDefnCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'active',
    description: 'Lists the process defns',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--full': { description: 'Show full details' },
      '--debug': { description: 'Show debug information' },
    },
    action: async ( _, opts ) => {
      const { full, debug, camunda } = await fetchCamundaDetails ( opts, tc );
      // const active = await activeProcesses ( tc.context.camundaFetch )
      if ( debug ) console.log ( JSON.stringify ( camunda, null, 2 ) )
      const processes = await processDefns ( tc.context.camundaFetch, camunda );
      for ( const p of processes )
        console.log ( full ? JSON.stringify ( p, null, 2 ) : p.id )
    }
  }
}
export function addHistoricalTasks<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'history',
    description: 'Lists the  processes using history api',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--full': { description: 'Show full details' },
      '--debug': { description: 'Show debug information' },
    },
    action: async ( _, opts ) => {
      const { full, debug, camunda } = await fetchCamundaDetails ( opts, tc );
      // const active = await activeProcesses ( tc.context.camundaFetch )
      if ( debug ) console.log ( JSON.stringify ( camunda, null, 2 ) )
      const processes = await historicProcesses ( tc.context.camundaFetch, camunda );
      for ( const p of processes )
        console.log ( full ? JSON.stringify ( p, null, 2 ) : p.id )
    }
  }
}

async function getVars<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig>, camunda: CamundaDefn, t: any ) {
  try {
    return await variablesForTask ( tc.context.camundaFetch, camunda, t.id );
  } catch ( e: any ) {
    return { error: e.message }
  }
}
export function addTasksForId<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'tasks [id]',
    description: 'Lists the tasks for a  history process id. If not specified get from all ids',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--full': { description: 'Show full details' },
      '--debug': { description: 'Show debug information' },
    },
    action: async ( _, opts, id ) => {
      const { full, debug, camunda } = await fetchCamundaDetails ( opts, tc );
      // const active = await activeProcesses ( tc.context.camundaFetch )
      if ( debug ) console.log ( JSON.stringify ( camunda, null, 2 ) )
      if ( id ) {
        const ts = await externalTasks ( tc.context.camundaFetch, camunda, id );

        // console.log ( full ? JSON.stringify ( ts, null, 2 ) : p.id )
        console.log ( JSON.stringify ( ts, null, 2 ) )
      }
      const processes = await historicProcesses ( tc.context.camundaFetch, camunda );
      for ( const p of processes ) {
        console.log ( p.id, p.state )
        let eTasks = await externalTasks ( tc.context.camundaFetch, camunda, p.id );
        for ( const t of eTasks ) {
          let vars = await getVars ( tc, camunda, t );
          console.log ( '  ', t.id, JSON.stringify ( vars ) )
        }
      }
    }
  }
}

export function camundaCommands<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): SubCommandDetails<Commander, ThereAndBackContext, Config> {
  return {
    cmd: 'camunda',
    description: 'camunda commands',
    commands: [
      processDefnCommand<Commander, Config, CleanConfig> ( tc ),
      addHistoricalTasks<Commander, Config, CleanConfig> ( tc ),
      addTasksForId<Commander, Config, CleanConfig> ( tc ),
    ]
  }
}
