#!/usr/bin/env node
import { CliTc, fixedConfig, makeCli } from "@itsmworkbench/cli";
import { fileOpsNode } from "@laoban/filesops-node";
import { Commander12, commander12Tc } from "@itsmworkbench/commander12";
import { jsYaml } from "@itsmworkbench/jsyaml";
import { hasErrors, reportErrors } from "@laoban/utils";
import { configCommands } from "./src/configCommands";
import { ThereAndBackContext, thereAndBackContext } from "./src/context";

export function findVersion () {
  let packageJsonFileName = "../package.json";
  try {
    return require ( packageJsonFileName ).version
  } catch ( e ) {
    return "version not known"
  }
}

export type NoConfig = {}
const context: ThereAndBackContext = thereAndBackContext ( 'intellimaintain', findVersion (), fileOpsNode (), jsYaml () )
const cliTc: CliTc<Commander12, ThereAndBackContext, NoConfig, NoConfig> = commander12Tc<ThereAndBackContext, NoConfig, NoConfig> ()
const configFinder = fixedConfig<NoConfig> ( context )

makeCli<Commander12, ThereAndBackContext, NoConfig, NoConfig> ( context, configFinder, cliTc ).then ( async ( commander ) => {
  if ( hasErrors ( commander ) ) {
    reportErrors ( commander )
    process.exit ( 1 )
  }
  cliTc.addSubCommand ( commander, configCommands ( commander ) )
  // cliTc.addCommands ( commander, [ apiCommand ( yaml ) ] )
  return await cliTc.execute ( commander.commander, context.args )
} )