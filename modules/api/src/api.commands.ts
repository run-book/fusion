import { CommandFn, HasCurrentDirectory } from "@itsmworkbench/cli";
import { startKoa } from "@itsmworkbench/koa";
import { fusionHandlers } from "./api";
import { CommentFactoryFunction, defaultCommentOffset, LoadFilesFn } from "@fusionconfig/config";
import { PostProcessor } from "@fusionconfig/config";
import { UrlStore } from "@itsmworkbench/urlstore";


export type  ApiCommandContext = HasCurrentDirectory & {
  loadFiles: LoadFilesFn
  postProcessors: ( directory: string ) => PostProcessor[]
  commentFactoryFn: CommentFactoryFunction
  urlStore: UrlStore
}
export function apiCommand<Commander, Context extends ApiCommandContext, Config> (): CommandFn<Commander, Context, Config> {
  return ( context, config ) => ({
    cmd: 'api ',
    description: 'Runs the api that supports the Wizard Of Oz',
    options: {
      '-d, --directory <directory>': { description: 'The directory that files are served from (config)', default: context.currentDirectory },
      '-u, --urlStore <urlDirectory>': { description: 'The directory that urlstore files are served from (schemas and transformers)', default: context.currentDirectory },
      '-p, --port <port>': { description: 'Port to run the server on', default: "1235" },
      '--c, --comment-offset <commentOffset>': { description: 'The offset for the comments. How far to the right are the comments', default: defaultCommentOffset },
      '--debug': { description: 'More debug information ' },
      '-i,--id <idroot>': { description: "The root of the id store", default: "ids" }
    },
    action: async ( commander, opts ) => {
      console.log(JSON.stringify(opts, null, 2))
      const { port, debug, directory, commentOffset: commentOffsetString, urlStore } = opts
      const commentOffset = Number.parseInt ( commentOffsetString.toString () )
      let debugBoolean = debug === true;
      console.log ( 'directory', directory )
      console.log ( 'port', port )
      console.log ( 'debug', debug )
      startKoa ( directory.toString (), Number.parseInt ( port.toString () ), debugBoolean,
        fusionHandlers ( context.urlStore,
          context.loadFiles, context.postProcessors ( urlStore.toString () ),
          context.commentFactoryFn ( commentOffset ),
          directory.toString (), debugBoolean, ) )
    }
  })

}