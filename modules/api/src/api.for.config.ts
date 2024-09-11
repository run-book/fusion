import { KoaPartialFunction } from "@itsmworkbench/koa";
import path from "path";
import fs from "fs/promises";

/** This matches /config/geo/filename */
export const matchConfig = /\/config\/(.*)$/;
export const getConfig = ( parent: string, debug?: boolean ): KoaPartialFunction => {
  return ({
    isDefinedAt: ( ctx ) => {
      const match = matchConfig.exec ( ctx.context.request.path );
      const isMethodMatch = ctx.context.request.method === 'GET';
      return (match && isMethodMatch) === true;
    },
    apply: async ( ctx ) => {
      const match = matchConfig.exec ( ctx.context.request.path );
      if ( match === null ) throw new Error ( 'match is null' )
      const fileName = match[ 1 ];
      const fullFile = path.join ( parent, fileName )

      const data = await fs.readFile ( fullFile, 'utf8' )

      ctx.context.status = 200;
      ctx.context.body = data;
      ctx.context.set ( 'Content-Type', 'application/json' );
    }
  });
};
