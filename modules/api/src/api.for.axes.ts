import { KoaPartialFunction } from "@itsmworkbench/koa";
import { isLegalParameter } from "@fusionconfig/config";
import path from "path";
import { NameAnd } from "@laoban/utils";
import { FileOps } from "@laoban/fileops";

export const matchAxes = /\/axes\/(.*)$/;
export const getAxes = ( fileops: FileOps, directory: string, debug?: boolean ): KoaPartialFunction => {
  return ({
    isDefinedAt: ( ctx ) => {
      const match = matchAxes.exec ( ctx.context.request.path );
      const isMethodMatch = ctx.context.request.method === 'GET';
      return match && isMethodMatch;
    },
    apply: async ( ctx ) => {
      const match = matchAxes.exec ( ctx.context.request.path );
      const rawFile = match[ 1 ];
      const configFileName = path.join ( directory, rawFile )
      const config = await fileops.loadFileOrUrl ( configFileName )
      //add 404
      const params = JSON.parse ( config ).parameters
      const result: NameAnd<string[]> = {}
      Object.entries ( params || {} ).forEach ( ( [ name, p ] ) => {
        if ( isLegalParameter ( p ) )
          result[ name ] = p.legal
      } )
      ctx.context.status = 200;
      ctx.context.body = JSON.stringify ( result, null, 2 )
    }
  });
};
