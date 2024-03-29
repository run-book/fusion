import { ContextAndStats, defaultShowsError, KoaPartialFunction, notFoundIs404 } from "@itsmworkbench/koa";
import { NameSpaceDetails, UrlStore } from "@itsmworkbench/urlstore";
import { NameAnd } from "@laoban/utils";
import { getUrls, listUrls, putUrls } from "@itsmworkbench/apiurlstore";
import { chainOfResponsibility } from "@runbook/utils";


export const fusionHandlers = (
  details: NameAnd<NameSpaceDetails>,
  urlStore: UrlStore,
  ...handlers: KoaPartialFunction[] ): ( from: ContextAndStats ) => Promise<void> =>
  chainOfResponsibility ( defaultShowsError, //called if no matches
    listUrls ( urlStore.list ),
    getUrls ( urlStore ),
    putUrls ( urlStore.save, details ),
    // handleFile,
    ...handlers,
    notFoundIs404,
  )