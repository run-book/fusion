import { ContextAndStats, defaultShowsError, KoaPartialFunction, notFoundIs404 } from "@itsmworkbench/koa";
import { NameSpaceDetails, UrlStore } from "@itsmworkbench/urlstore";
import { NameAnd } from "@laoban/utils";
import { getUrls, listUrls, putUrls } from "@itsmworkbench/apiurlstore";
import { chainOfResponsibility } from "@runbook/utils";
import { getFusion, matchFusion, matchRawFusion } from "./api.for.fusion";
import { LoadFilesFn } from "@fusionconfig/config";
import { PostProcessor } from "@fusionconfig/config";


export const fusionHandlers = (
  urlStore: UrlStore,
  loadFile: LoadFilesFn,
  postProcessors: PostProcessor[],
  parent: string,
  debug: boolean | undefined,
  ...handlers: KoaPartialFunction[] ): ( from: ContextAndStats ) => Promise<void> =>
  chainOfResponsibility ( defaultShowsError, //called if no matches
    listUrls ( urlStore.list ),
    getUrls ( urlStore ),
    getFusion ( matchRawFusion, loadFile, [], parent, debug ),
    getFusion ( matchFusion, loadFile, postProcessors, parent, debug ),
    ...handlers,
    notFoundIs404,
  )