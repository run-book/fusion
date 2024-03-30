import { CommandFn, HasCurrentDirectory } from "@itsmworkbench/cli";
import { startKoa } from "@itsmworkbench/koa";
import { fusionHandlers } from "./api";
import { LoadFilesFn } from "@fusionconfig/config";
import { PostProcessor } from "@fusionconfig/config/dist/src/post.process";
import { UrlStore } from "@itsmworkbench/urlstore";


export type  ApiCommandContext = HasCurrentDirectory & {
  loadFiles: LoadFilesFn
  postProcessors: PostProcessor[]
  urlStore: UrlStore
}
export function apiCommand<Commander, Context extends ApiCommandContext, Config> (): CommandFn<Commander, Context, Config> {
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
      let debugBoolean = debug === true;
      console.log ( 'directory', directory )
      console.log ( 'port', port )
      console.log ( 'debug', debug )
      startKoa ( directory.toString (), Number.parseInt ( port.toString () ), debugBoolean,
        fusionHandlers ( context.urlStore, context.loadFiles, context.postProcessors, directory.toString (), debugBoolean, ) )
    }
  })

}