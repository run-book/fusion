import { RetryPolicyConfig } from "@fusionconfig/indexing/src/worker.domain";
import { K0, K1, K2, K3, K4, K5, Kleisli } from "./kleisli";
import { Throttling, withThrottle } from "./throttling";
import { withRetry } from "./retry";
import { LogConfig, LogConfig0, LogConfig1, LogConfig2, LogConfig3, LogConfig4, LogConfig5 } from "./log";
import { withDebug } from "./debug";

export type ActivityCommon = { id: string, retry: RetryPolicyConfig, throttle: Throttling, debug?: boolean }

export function activity<T> ( config: ActivityCommon & LogConfig0<T>, fn: K0<T> ): K0<T>
export function activity<P1, T> ( config: ActivityCommon & LogConfig1<P1, T>, fn: K1<P1, T> ): K1<P1, T>
export function activity<P1, P2, T> ( config: ActivityCommon & LogConfig2<P1, P2, T>, fn: K2<P1, P2, T> ): K2<P1, P2, T>
export function activity<P1, P2, P3, T> ( config: ActivityCommon & LogConfig3<P1, P2, P3, T>, fn: K3<P1, P2, P3, T> ): K3<P1, P2, P3, T>
export function activity<P1, P2, P3, P4, T> ( config: ActivityCommon & LogConfig4<P1, P2, P3, P4, T>, fn: K4<P1, P2, P3, P4, T> ): K4<P1, P2, P3, P4, T>
export function activity<P1, P2, P3, P4, P5, T> ( config: ActivityCommon & LogConfig5<P1, P2, P3, P4, P5, T>, fn: K5<P1, P2, P3, P4, P5, T> ): K5<P1, P2, P3, P4, P5, T>

export function activity<T> ( config: ActivityCommon & LogConfig<T>, fn: ( ...args: any[] ) => Promise<T> ): Kleisli<T> {
  const newFn: ( ...args: any[] ) => Promise<T> = withRetry ( withThrottle ( withDebug ( fn, config ), config.throttle ), config.retry )
  return newFn
}

