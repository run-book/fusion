import { CommandDetails, ContextConfigAndCommander, SubCommandDetails } from "@itsmworkbench/cli";
import path from "path";
import { findPart, firstSegment, NameAnd } from "@laoban/utils";

import { ThereAndBackContext } from "./context";
import { loadAndMergeAndYamlParts, Merged } from "@fusionconfig/config";
import { parseParams } from "@fusionconfig/utils";


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
      const fileDetails = await tc.context.loadFiles ( params, parent, file, opts.debug === true )
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
      let { fileDetails, errors, sorted, yaml } = await loadAndMergeAndYamlParts ( tc.context.loadFiles, params, parent, file, opts.debug === true );
      if ( errors.length > 0 ) {
        console.log ( 'Errors:' )
        fileDetails.filter ( f => f.errors.length > 0 ).forEach ( f => console.log ( f.file, f.errors ) )
        process.exit ( 1 )
      }
      if ( opts.full === true )
        console.log ( JSON.stringify ( sorted.value, null, 2 ) )
      else {
        console.log ( yaml )
      }
    }
  }
}
export function findPartInFull ( dic: Merged, ref: string ): any {
  if ( ref === undefined ) return undefined
  if ( ref === '' ) return dic
  const parts = ref.split ( '.' )
  try {
    return parts.reduce ( ( acc, part ) => acc?.value?.[ firstSegment ( part, ':' ) ], dic )
  } catch ( e ) {return undefined}
}


export function addPropertyCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'property <property>',
    description: 'Produces the composite merged file',
    options: {
      '-f, --file <file>': { description: 'The root config file', default: 'global.yaml' },
      '-p, --params <params>': { description: 'The parameters to use. Comma seperated attribute=value' },
      '--debug': { description: 'Show debug information' },
      '--full': { description: 'Show more data about the files' },
      '--keys': { description: 'If an object shows the keys' },
    },
    action: async ( _, opts, property ) => {
      const { params, file, parent } = fromOpts ( opts );
      let { fileDetails, errors, yaml, sorted } = await loadAndMergeAndYamlParts ( tc.context.loadFiles, params, parent, file, opts.debug === true );
      if ( errors.length > 0 ) {
        console.log ( 'Errors:' )
        fileDetails.filter ( f => f.errors.length > 0 ).forEach ( f => console.log ( f.file, f.errors ) )
        process.exit ( 1 )
      }
      if ( opts.full === true ) {
        console.log ( JSON.stringify ( property === '.' ? sorted : findPartInFull ( sorted, property ), null, 2 ) )
      } else {
        const simplified = tc.context.yaml.parser ( yaml )
        let result = property == '.' ? simplified : findPart ( simplified, property );
        if ( opts.keys ) {
          if ( typeof result === 'object' )
            Object.keys ( result ).sort ().forEach ( k => console.log ( k ) )
          else
            console.log ( 'Not an object' )
        } else {
          if ( typeof result === 'object' )
            console.log ( JSON.stringify ( result, null, 2 ) )
          else
            console.log ( result )
        }
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
      mergeFilesCommand<Commander, Config, CleanConfig> ( tc ),
      addPropertyCommand<Commander, Config, CleanConfig> ( tc )
    ]
  }
}
