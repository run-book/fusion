import { CommandDetails, ContextConfigAndCommander, SubCommandDetails } from "@itsmworkbench/cli";

import { ThereAndBackContext } from "./context";
import { defaultIgnoreFilter } from "@laoban/fileops";
import { findChildFiles } from "./find.files";
import { NameSpaceDetailsForGit } from "@itsmworkbench/urlstore";
import path from "path";
import { pathListToJson } from "@fusionconfig/utils";


export function listTransformersCommand<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig>, transformNs: NameSpaceDetailsForGit ): CommandDetails<Commander> {
  return {
    cmd: 'list',
    description: 'finds all the transformers in the config',
    options: {
      '-d, --directory <directory>': { description: 'The directory that files are served from', default: tc.context.currentDirectory },
      '--debug': { description: 'Show debug information' },
    },
    action: async ( _, opts ) => {
      const { directory, debug } = opts
      const start = path.join ( directory as string, 'org', transformNs.pathInGitRepo )
      console.log ( "Options: ", start )
      const dotExtension = '.' + transformNs.extension
      const childFiles = await findChildFiles ( tc.context.fileOps, defaultIgnoreFilter, s => s.endsWith (dotExtension ) ) ( start )
      console.log ( 'childFiles', childFiles )
      const json = pathListToJson( childFiles, `Expecting only one file with extension ${dotExtension}: ` )
      console.log('json', JSON.stringify(json, null, 2))
    }
  }
}

export function transformerCommands<Commander, Config, CleanConfig> ( tc: ContextConfigAndCommander<Commander, ThereAndBackContext, Config, CleanConfig>, transformNs: NameSpaceDetailsForGit ): SubCommandDetails<Commander, Config, ThereAndBackContext> {
  return {
    cmd: 'transformer',
    description: 'Transformer commands',
    commands: [
      listTransformersCommand<Commander, Config, CleanConfig> ( tc, transformNs ),
    ]
  }
}
