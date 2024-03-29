#!/usr/bin/env node
import { makeCli } from "@itsmworkbench/cli";
import { Commander12 } from "@itsmworkbench/commander12";
import { hasErrors, reportErrors } from "@laoban/utils";
import { configCommands } from "./src/configCommands";
import { cliTc, configFinder, context, ThereAndBackContext } from "./src/context";
import { apiCommand } from "@fusionconfig/api";

export function findVersion () {
  let packageJsonFileName = "../package.json";
  try {
    return require ( packageJsonFileName ).version
  } catch ( e ) {
    return "version not known"
  }
}

export type NoConfig = {}

makeCli<Commander12, ThereAndBackContext, NoConfig, NoConfig> ( context ( findVersion () ), configFinder, cliTc ).then ( async ( commander ) => {
  if ( hasErrors ( commander ) ) {
    reportErrors ( commander )
    process.exit ( 1 )
  }
  cliTc.addSubCommand ( commander, configCommands ( commander ) )
  cliTc.addCommands ( commander, [ apiCommand () ] )
  return await cliTc.execute ( commander.commander, context.args )
} )