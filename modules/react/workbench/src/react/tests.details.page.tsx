import { ReqRespTx, Tests } from "../state/fusion.state";
import { LensProps2 } from "@focuson/state";

export type TestsDetailsPageProps<S> = LensProps2<S, Tests, ReqRespTx, any> & {}
export function TestsDetailsPage<S> ( { state }: TestsDetailsPageProps<S> ) {
  return <div>TestsDetailsPage: {state.optJson2 ()}</div>

}