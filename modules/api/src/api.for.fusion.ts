import { ListNamesOrder, loadFromString, NameSpaceDetails, parseNamedUrlOrThrow, parseUrl, UrlListFn, UrlLoaders, UrlSaveFn, UrlStoreResult, urlToDetails } from "@itsmworkbench/urlstore";

import { ErrorsAnd, hasErrors, mapErrorsK, NameAnd } from "@laoban/utils";
import { KoaPartialFunction } from "@itsmworkbench/koa";


export const getFusion = ( loader: UrlLoaders ): KoaPartialFunction => ({
  isDefinedAt: ( ctx ) => {
    const match = /\/url\/([^\/]+)/.exec ( ctx.context.request.path );
    const isMethodMatch = ctx.context.request.method === 'GET';
    return match && isMethodMatch;
  },
  apply: async ( ctx ) => {
    const match = /\/url\/(itsm.*)/.exec ( ctx.context.request.path );
    const url = match[ 1 ];
    const identityOrNamedUrl = parseUrl ( url )
    if ( hasErrors ( identityOrNamedUrl ) ) {
      ctx.context.status = 40;
      ctx.context.body = identityOrNamedUrl.join ( '\n' );
      return;
    }
    try {
      console.log ( `${'GET'}Urls`, url );
      // The actionFn is either 'loader' for GET or 'save' for PUT
      let requestBody = ctx.context.request.rawBody;
      const query = ctx.context.request.query
      const offset = Number.parseInt ( query.offset || "0" )
      console.log ( 'start', offset, 'requestBody', requestBody )
      const result = await loadFromString ( loader, url, offset );
      if ( hasErrors ( result ) ) {
        console.log ( `${'GET'}Urls - errors`, result )
        ctx.context.status = 500;
        ctx.context.body = result.join ( '\n' );
        return;
      }
      ctx.context.body = JSON.stringify ( result );
      ctx.context.set ( 'Content-Type', 'application/json' );
    } catch ( e ) {
      ctx.context.status = 404;
      ctx.context.body = e.toString ();
    }
  }
});
export const putUrls = ( save: UrlSaveFn, nsToDetails: NameAnd<NameSpaceDetails> ): KoaPartialFunction => ({
  isDefinedAt: ( ctx ) => {
    const match = /\/url\/itsm/.exec ( ctx.context.request.path );
    const isMethodMatch = ctx.context.request.method === 'PUT';
    return match && isMethodMatch;
  },
  apply: async ( ctx ) => {
    console.log ( 'putUrls', ctx.context.request.path )
    const match = /\/url\/(itsm.*)/.exec ( ctx.context.request.path );
    console.log ( 'match', match )
    const url = match[ 1 ];
    const append = ctx.context.request.query.append === 'true'
    const commit = ctx.context.request.query.commit !== 'false'
    try {
      console.log ( `${'PUT'}Urls`, url );
      // The actionFn is either 'load' for GET or 'save' for PUT
      let requestBody: any = ctx.context.request.rawBody;
      console.log ( 'requestBody', requestBody )
      const named = parseNamedUrlOrThrow ( url )
      const details = urlToDetails ( nsToDetails, named )
      const result: ErrorsAnd<UrlStoreResult> = await mapErrorsK ( details, async d => {
        const parsed = await d.parser ( url, requestBody )
        console.log ( 'parsed', 'sizein', requestBody.length, details )
        console.log ( 'parsed', parsed )
        return await save ( named, parsed, { append, commit } );
      } )
      if ( hasErrors ( result ) ) {
        console.log ( `${'PUT'}Urls - errors`, result )
        ctx.context.status = 500;
        ctx.context.body = result.join ( '\n' );
        return;
      }
      ctx.context.body = JSON.stringify ( result );
      ctx.context.set ( 'Content-Type', 'application/json' );
    } catch ( e ) {
      ctx.context.status = 404;
      ctx.context.body = e.toString ();
    }
  }
});

const listUrlRegex = /^\/url\/list\/([^\/]+)\/([^\/]+)$/;


const getOrder = ( order: string | undefined ): ListNamesOrder => {
  if ( order === undefined ) return 'name'
  if ( order === '' ) return 'name'
  if ( order === 'date' ) return 'date'
  if ( order === 'name' ) return 'name'
  throw new Error ( `Invalid order parameter: ${order}. Must be 'name' or 'date'.` );
};

const getIntegerWithDefault = ( value, defaultValue ) => {
  const parsed = parseInt ( value, 10 );
  return isNaN ( parsed ) || parsed < 1 ? defaultValue : parsed;
};

// Extracting from ctx.query and applying defaults


// Now pageSize, page, and order have either the values from the query params or the defaults

export const listUrls = ( list: UrlListFn ): KoaPartialFunction => ({
  isDefinedAt: ( ctx ) => {
    const match = listUrlRegex.exec ( ctx.context.request.path );
    const isMethodMatch = ctx.context.request.method === 'GET';
    return match && isMethodMatch;
  },
  apply: async ( ctx ) => {
    const match = listUrlRegex.exec ( ctx.context.request.path );
    if ( match ) {
      const org = match[ 1 ];
      const namespace = match[ 2 ];
      try {
        const pageSize = getIntegerWithDefault ( ctx.context.query.pageSize, 10 );
        const page = getIntegerWithDefault ( ctx.context.query.page, 1 );
        const order = getOrder ( ctx.context.query.order );
        const filter = ctx.context.query.filter;

        console.log ( 'filter', filter )
        const result = await list ( { org, namespace, pageQuery: { page, pageSize }, order, filter } )
        if ( hasErrors ( result ) ) {
          console.log ( 'listUrls - errors', result )
          ctx.context.status = 500;
          ctx.context.body = result.join ( '\n' );
          return;
        }
        ctx.context.body = JSON.stringify ( result );
        ctx.context.set ( 'Content-Type', 'application/json' );
      } catch ( e ) {
        ctx.context.status = 500;
        ctx.context.body = e.toString ();
      }
    } else {
      ctx.context.status = 501;
      ctx.context.body = `didn't match regex ${listUrlRegex} with ${ctx.context.request.path}`
    }
  }
});

