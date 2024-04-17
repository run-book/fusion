import { ContextAndStats, defaultShowsError, KoaPartialFunction, notFoundIs404 } from "@itsmworkbench/koa";
import { NameSpaceDetails, UrlStore } from "@itsmworkbench/urlstore";
import { NameAnd } from "@laoban/utils";
import { getUrls, listUrls, putUrls } from "@itsmworkbench/apiurlstore";
import { chainOfResponsibility } from "@runbook/utils";
import { getFusion, matchFusion, matchRawFusion } from "./api.for.fusion";
import { CommentFunction, LoadFilesFn } from "@fusionconfig/config";
import { PostProcessor } from "@fusionconfig/config";
import { callService, matchService } from "./api.for.call.service";
import { FileOps } from "@laoban/fileops";
import { getAxes, matchAxes } from "./api.for.axes";


export const fusionHandlers = (
  configFileName: string,
  urlStore: UrlStore,
  fileOps: FileOps,
  loadFile: LoadFilesFn,
  postProcessors: PostProcessor[],
  commentFn: CommentFunction,
  parent: string,
  debug: boolean | undefined,
  ...handlers: KoaPartialFunction[] ): ( from: ContextAndStats ) => Promise<void> =>
  chainOfResponsibility ( defaultShowsError, //called if no matches
    listUrls ( urlStore.list ),
    getUrls ( urlStore ),
    getFusion ( matchRawFusion, loadFile, [], commentFn, parent, debug ),
    getFusion ( matchFusion, loadFile, postProcessors, commentFn, parent, debug ),
    getAxes(fileOps, configFileName),
    callService ( matchService, fileOps,urlStore, debug ),
    ...handlers,
    notFoundIs404,
  )