import { CommandDetails, ContextConfigAndCommander, HasCurrentDirectory, SubCommandDetails } from "@itsmworkbench/cli";
import { UrlStore } from "@itsmworkbench/urlstore";


export interface TestContext extends HasCurrentDirectory {
  urlStore: UrlStore
}

export function listTestsCommand<Commander, Context extends TestContext, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, Context, Config, CleanConfig> ): CommandDetails<Commander> {
  return {
    cmd: 'list <schema>',
    description: 'lists all the tests for the schema',
    options: {
      '-u, --urlStore <urlDirectory>': { description: 'The directory that urlstore files are served from (schemas and transformers)', default: tc.context.currentDirectory },
      '--debug': { description: 'Show debug information' },
    },
    action: async ( _, opts, property ) => {
      const { debug, urlDirectory } = opts;
      console.log ( 'listing' )
    }
  }
}


export function testCommands<Commander, Context extends TestContext, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, Context, Config, CleanConfig> ): SubCommandDetails<Commander, Config, Context> {
  return {
    cmd: 'tests',
    description: 'Test commands',
    commands: [
      listTestsCommand ( tc )
    ]
  }
}
