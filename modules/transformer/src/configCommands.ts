import { CliContext, CommandDetails, ContextConfigAndCommander, HasCurrentDirectory, SubCommandDetails } from "@itsmworkbench/cli";
import path from "path";
import { flatMap, NameAnd } from "@laoban/utils";
import { recursivelyFindFileNames } from "./transform";
import { HasYaml, ThereAndBackContext } from "./context";
import { Merged, mergeObjectInto } from "./merge";
import { convertToYaml, defaultCommentFunction } from "./convert.to.yaml";


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
      '--full': { description: 'Show more data about the files' },
      '--errors': { description: 'Just show errors' }
    },
    action: async ( _, opts ) => {
      const { params, file, parent } = fromOpts ( opts );
      const fileDetails = await recursivelyFindFileNames ( { fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true )
      const errors = fileDetails.filter ( f => f.errors.length > 0 )
      if ( opts.errors )
        errors.forEach ( f => console.log ( f ) )
      else if ( opts.full )
        fileDetails.forEach ( ( { yaml, ...rest } ) => console.log ( rest ) )
      else {
        fileDetails.forEach ( f => console.log ( f.file ) )
        if ( errors.length > 0 ) {
          console.log ( 'Errors:' )
          fileDetails.filter ( f => f.errors.length > 0 ).forEach ( f => console.log ( f.file, f.errors ) )
        }
      }
      if ( errors.length > 0 ) process.exit ( 1 )
    }
  }

}
export function mergeFilesCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'merge',
    description: 'Produces the composite merged file',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--debug': { description: 'Show debug information' },
      '--full': { description: 'Show more data about the files' }
    },
    action: async ( _, opts ) => {
      const { params, file, parent } = fromOpts ( opts );
      const fileDetails = await recursivelyFindFileNames ( { fileOps: tc.context.fileOps, yaml: tc.context.yaml, dic: params }, parent, [], file, opts.debug === true )
      const errors = fileDetails.filter ( f => f.errors.length > 0 )
      if ( errors.length > 0 ) {
        console.log ( 'Errors:' )
        fileDetails.filter ( f => f.errors.length > 0 ).forEach ( f => console.log ( f.file, f.errors ) )
        process.exit ( 1 )
      }
      const merged: Merged = fileDetails.reduce ( ( acc, fd ) => mergeObjectInto ( acc, fd ), { value: undefined, files: [] } )
      if ( opts.full === true )
        console.log ( JSON.stringify ( merged.value, null, 2 ) )
      else {
        const { version, parameters, hierarchy, ...rest } = merged.value as any
        const sorted = { version, parameters, hierarchy, ...rest }
        console.log ( `# ${JSON.stringify ( params )}` )
        console.log ( "#" )
        console.log ( "# Files" )
        fileDetails.filter ( f => f.exists ).forEach ( ( { yaml, ...rest } ) => console.log ( `# ${JSON.stringify ( rest )}` ) )
        console.log ( "#" )
        console.log ( "# Files not found" )
        fileDetails.filter ( f => !f.exists ).forEach ( ( { yaml, ...rest } ) => console.log ( `# ${JSON.stringify ( rest )}` ) )
        console.log ( "#" )
        console.log ( convertToYaml ( { value: sorted, files: merged.files }, defaultCommentFunction ) )
      }
    }
  }
}


export function configCommands<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): SubCommandDetails<Commander, Config, ThereAndBackContext> {
  return {
    cmd: 'config',
    description: 'Config commands',
    commands: [
      viewConfigCommand<Commander, Config, CleanConfig> ( tc ),
      listFilesCommand<Commander, Config, CleanConfig> ( tc ),
      mergeFilesCommand<Commander, Config, CleanConfig> ( tc )
    ]
  }
}
