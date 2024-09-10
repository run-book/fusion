import { NameAnd } from "@laoban/utils";
import { Timeservice } from "@itsmworkbench/utils";
import { ApiKeyAuthentication, Authentication, BasicAuthentication, EntraIdAuthentication, isApiKeyAuthentication, isBasicAuthentication, isEntraIdAuthentication, isNoAuthentication, isPrivateTokenAuthentication, PrivateTokenAuthentication } from "./authentication.domain";

export type AuthFn = ( auth: Authentication ) => Promise<NameAnd<string>>

function authForApiToken ( env: NameAnd<string | undefined>, auth: ApiKeyAuthentication ) {
  const apiKey = auth.credentials?.apiKey;
  if ( !apiKey ) throw Error ( 'No apiKey in ' + JSON.stringify ( auth ) )
  const token = env[ apiKey ]
  if ( !token ) throw Error ( 'No token for apiKey ' + apiKey )
  return { Authorization: `Bearer ${token}` }
}

function authForBasic ( env: NameAnd<string | undefined>, auth: BasicAuthentication ) {
  if ( !auth.credentials.username ) throw Error ( 'No username in ' + JSON.stringify ( auth ) )
  if ( !auth.credentials.password ) throw Error ( 'No password in ' + JSON.stringify ( auth ) )
  const password = env[ auth.credentials.password ]
  if ( !password ) throw Error ( 'No password in environment for ' + auth.credentials.password )
  return { Authorization: `Basic ${Buffer.from ( `${auth.credentials.username}:${password}` ).toString ( 'base64' )}` }
}
async function authForPrivate ( env: NameAnd<string | undefined>, auth: PrivateTokenAuthentication ) {
  const privateKey = auth.credentials?.token;
  if ( !privateKey ) throw Error ( 'No privateKey in ' + JSON.stringify ( auth ) )
  const token = env[ privateKey ]
  if ( !token ) throw Error ( 'No token for privateKey ' + privateKey )
  return { 'PRIVATE-TOKEN': token }
}

export type TokenAndTime = {
  token: string
  expires: number
}

export type TokenCache = NameAnd<Promise<TokenAndTime> | undefined>


export type AuthForEntraIdFn = ( env: NameAnd<string | undefined>, fetch: FetchFn, oauth: EntraIdAuthentication ) => Promise<TokenAndTime>
export const authForEntraId: AuthForEntraIdFn = async ( env: NameAnd<string | undefined>, fetch: FetchFn, oauth: EntraIdAuthentication ) => {
  const { tenantId, clientId, clientSecret, resource, scope } = oauth.credentials;
  const version = oauth.credentials.version || 2
  const url = version === 2 ?
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token` :
    `https://accounts.accesscontrol.windows.net/${tenantId}/tokens/OAuth/2` //legacy but OK endpoint
  const body = new URLSearchParams ();
  const secret = env[ clientSecret ]
  if ( !secret ) throw Error ( `Need Environment variable for client secret ${clientSecret}` )
  body.append ( 'grant_type', 'client_credentials' );
  body.append ( 'client_id', clientId );
  if ( resource ) body.append ( 'resource', resource );
  body.append ( 'client_secret', secret );
  if ( scope ) body.append ( 'scope', scope );

  const options: FetchFnOptions = {
    method: 'Post',
    body: body.toString (),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  // console.log ( options )
  const response = await fetch ( url, options );

  if ( !response.ok ) {
    console.log ( await response.text () )
    throw new Error ( `Error fetching access token: ${response.status} ${response.statusText} ${JSON.stringify ( response.headers )}` );
  }

  const data = await response.json ();
  return { token: data.access_token, expires: data.expires_in }
};

export async function getOrUpdateEntraId (
  fetch: FetchFn,
  timeService: Timeservice,
  oauth: EntraIdAuthentication,
  tokenCache: TokenCache,
  authForEntraIdFn: AuthForEntraIdFn = authForEntraId
): Promise<string> {
  const key = oauth.credentials.clientId + '/' + oauth.credentials.scope
  const tokenDataPromise = tokenCache[ key ];
  if ( tokenDataPromise ) {
    const tokenData = await tokenDataPromise;
    if ( tokenData && tokenData.expires > timeService () ) return tokenData.token;
  }
  const doubleCheck = tokenCache[ key ]; //double sync check. the await in the above check can cause multiple fetches. Only causes wasted calls..but still...
  if ( doubleCheck && (await doubleCheck).expires > timeService () ) return (await doubleCheck).token;

  const newToken = authForEntraIdFn ( process.env, fetch, oauth ).then ( ( token: TokenAndTime ) => {
    if ( !token.token ) throw Error ( 'No access token in ' + JSON.stringify ( token ) )
    if ( !token.expires ) throw Error ( 'No expires in ' + JSON.stringify ( token ) )
    return ({ ...token, token: token.token, expires: timeService () + token.expires * 500 }) // we will get a new token well before the expiry is up
  } ).catch ( e => {
    console.error ( e );
    tokenCache[ key ] = undefined;
    throw e
  } )
  tokenCache[ key ] = newToken
  return (await newToken).token;
}
const globalTokenCache: TokenCache = {}
export const defaultAuthFn = ( env: NameAnd<string | undefined>, fetch: FetchFn, timeService: Timeservice, tokenCache: TokenCache = globalTokenCache ): AuthFn =>
  async ( auth: Authentication ) => {
    if ( isEntraIdAuthentication ( auth ) ) return { Authorization: `Bearer ${await getOrUpdateEntraId ( fetch, timeService, auth, tokenCache )}` }
    if ( isApiKeyAuthentication ( auth ) ) return authForApiToken ( env, auth );
    if ( isBasicAuthentication ( auth ) ) return authForBasic ( env, auth );
    if ( isPrivateTokenAuthentication ( auth ) ) return authForPrivate ( env, auth )
    if ( isNoAuthentication ( auth ) ) return {}
    throw Error ( 'Unknown auth method ' + JSON.stringify ( auth ) )
  };
export const findVarsFrom = ( env: NameAnd<string> ) => ( auth: Authentication | undefined ): string[] => {
  function value ( key: string ): string[] {
    const v = env[ key ]
    return [ `${key} ${v ? `: ${v}` : ' is undefined'}` ]
  }
  if ( auth === undefined ) return []
  if ( isEntraIdAuthentication ( auth ) ) return value ( auth.credentials.clientSecret )
  if ( isApiKeyAuthentication ( auth ) ) return value ( auth.credentials.apiKey );
  if ( isBasicAuthentication ( auth ) ) return value ( auth.credentials.password )
  if ( isPrivateTokenAuthentication ( auth ) ) return value ( auth.credentials.token )
  throw Error ( 'Unknown auth method ' + JSON.stringify ( auth ) )
};
export type FetchFnResponse = {
  status: number;
  ok: boolean;
  body: any;//Making this typesafe between node and react is incredulously difficult.
  json (): Promise<any>;
  text (): Promise<string>;
  headers: NameAnd<string>;
  statusText: string;
}

export type FetchMethod = 'Get' | 'Post' | 'Put' | 'Delete';
export type HeadersOrFn = NameAnd<string> | (() => Promise<NameAnd<string>>)
export async function headersFrom ( h: HeadersOrFn ): Promise<NameAnd<string>> {
  return typeof h === 'function' ? await h () : h
}
export async function optionsFrom ( o: FetchFnOptions | undefined ) {
  if ( !o ) return undefined
  const { headers, ...rest } = o
  return { ...rest, headers: headers && await headersFrom ( headers ) }
}
export type FetchFnOptions = {
  method?: FetchMethod
  headers?: HeadersOrFn;
  body?: string
  silentError?: boolean
}
export type FetchFn = ( url: string, options?: FetchFnOptions ) => Promise<FetchFnResponse>

export async function callFetch ( fetchFn: FetchFn, url: string, options?: FetchFnOptions, prefix?: string ) {
  const resp = await fetchFn ( url, options )
  if ( resp.ok ) return resp.json ()
  if ( prefix )
    throw new Error ( `${prefix} ${url} failed with ${resp.status} ${resp.statusText}` )
  else
    throw new Error ( `${url} failed with ${resp.status} ${resp.statusText} ${JSON.stringify ( resp.headers, null, 2 )}\n${await resp.text ()}` )
}

