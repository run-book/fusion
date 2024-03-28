import { CliContext, CommandDetails, ContextConfigAndCommander, HasCurrentDirectory, SubCommandDetails } from "@itsmworkbench/cli";
import path from "path";
import { flatMap, NameAnd } from "@laoban/utils";
import { recursivelyFindFileNames } from "./transform";
import { HasYaml, ThereAndBackContext } from "./context";


function parseParams ( params: string | boolean ) {
  if ( typeof params === 'string' ) {
    const pairs = params.split ( ',' )
    return pairs.reduce ( ( acc, pair ) => {
      const [ key, value ] = pair.split ( '=' )
      acc[ key ] = value
      return acc
    }, {} )
  }
  return {}

}
function fromOpts ( opts: NameAnd<string | boolean> ) {
  const params = parseParams ( opts.params )
  const file = opts.file as string
  const parent = path.dirname ( file )
  return { params, file: path.basename ( file ), parent };
}
export function viewConfigCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, any, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'view',
    description: 'View the current configuration',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' }
    },
    action: async ( _, opts ) => {
      const { params, file, parent } = fromOpts ( opts );
      console.log ( "Options: ", params, parent, file )
    }
  }
}
export function listFilesCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'list',
    description: 'List the files that are loaded',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--debug': { description: 'Show debug information' },
      '--errors': { description: 'Just show errors' }
    },
    action: async ( _, opts ) => {
      const { params, file, parent } = fromOpts ( opts );
      const fileDetails = await recursivelyFindFileNames ( { fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true )
      const errors = fileDetails.filter ( f => f.errors.length > 0 )
      if ( opts.errors )
        errors.forEach ( f => console.log ( f ) )
      else
        fileDetails.forEach ( f => console.log ( f ) )
      if ( errors.length > 0 ) process.exit ( 1 )
    }
  }

}

export function configCommands<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): SubCommandDetails<Commander, Config, ThereAndBackContext> {
  return {
    cmd: 'config',
    description: 'Config commands',
    commands: [
      viewConfigCommand<Commander, Config, CleanConfig> ( tc ),
      listFilesCommand<Commander, Config, CleanConfig> ( tc )
    ]
  }
}
