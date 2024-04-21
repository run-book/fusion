import { hasErrors } from "@laoban/utils";
import { RunTests, RunTestsDefn } from "@fusionconfig/tests";
import { KoaPartialFunction } from "@itsmworkbench/koa";


export const matchTests = /\/tests$/;
export const oneTest = ( runTests: RunTests, debug?: boolean ): KoaPartialFunction => {
  return ({
    isDefinedAt: ( ctx ) => {
      const match = matchTests.exec ( ctx.context.request.path );
      const isMethodMatch = ctx.context.request.method === 'POST';
      return match && isMethodMatch;
    },
    apply: async ( ctx ) => {
      const body: RunTestsDefn = JSON.parse ( ctx.context.request.rawBody );
      const result = await runTests ( body );
      ctx.context.body = JSON.stringify ( result, null, 2 );
      if ( hasErrors ( result ) )
        ctx.context.status = 400;
      else
        ctx.context.status = 200;
    }
  });
};
