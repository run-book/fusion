import { CommandFn, HasCurrentDirectory } from "@itsmworkbench/cli";
import { startKoa } from "@itsmworkbench/koa";
import { nodeUrlstore } from "@itsmworkbench/nodeurlstore";
import { shellGitsops } from "@itsmworkbench/shellgit";
import { OrganisationUrlStoreConfigForGit } from "@itsmworkbench/urlstore";
import { fusionHandlers } from "./api";


export function apiCommand<Commander, Context extends HasCurrentDirectory, Config> ( ): CommandFn<Commander, Context, Config> {
  return ( context, config ) => ({
    cmd: 'api ',
    description: 'Runs the api that supports the Wizard Of Oz',
    options: {
      '-d, --directory <directory>': { description: 'The directory that files are served from', default: context.currentDirectory },
      '-p, --port <port>': { description: 'Port to run the server on', default: "1235" },
      '--debug': { description: 'More debug information ' },
      '-i,--id <idroot>': { description: "The root of the id store", default: "ids" }
    },
    action: async ( commander, opts ) => {
      const { port, debug, directory } = opts

      const orgs: OrganisationUrlStoreConfigForGit = { baseDir: 'fusion', nameSpaceDetails: {} }
      const gitOps = shellGitsops ( false )
      const urlStore = nodeUrlstore ( gitOps, orgs )
      startKoa ( directory.toString (), Number.parseInt ( port.toString () ), debug === true,
        fusionHandlers ( orgs.nameSpaceDetails, urlStore, ) )
    }
  })

}