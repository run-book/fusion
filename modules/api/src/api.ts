import { ContextAndStats, defaultShowsError, KoaPartialFunction, notFoundIs404 } from "@itsmworkbench/koa";
import { NameSpaceDetails, UrlStore } from "@itsmworkbench/urlstore";
import { NameAnd } from "@laoban/utils";
import { getUrls, listUrls, putUrls } from "@itsmworkbench/apiurlstore";
import { chainOfResponsibility } from "@runbook/utils";
import { getFusion } from "./api.for.fusion";
import { LoadFilesFn } from "@fusionconfig/config";


export const fusionHandlers = (
  loadFile: LoadFilesFn,
  parent: string,
  debug: boolean | undefined,
  ...handlers: KoaPartialFunction[] ): ( from: ContextAndStats ) => Promise<void> =>
  chainOfResponsibility ( defaultShowsError, //called if no matches
    getFusion ( loadFile, parent,debug ),
    ...handlers,
    notFoundIs404,
  )