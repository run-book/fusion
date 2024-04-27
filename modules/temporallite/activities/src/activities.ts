import { RetryPolicyConfig } from "@fusionconfig/indexing/src/worker.domain";
import { K0, K1, K2, K3, K4, K5, Kleisli } from "./kleisli";
import { Throttling, withThrottle } from "./throttling";
import { withRetry } from "./retry";

export type ActivityCommon = { id: string, retry: RetryPolicyConfig, throttle: Throttling }

export function activity<T> ( config: ActivityCommon, fn: K0<T> ): K0<T>
export function activity<P1, T> ( config: ActivityCommon, fn: K1<P1, T> ): K1<P1, T>
export function activity<P1, P2, T> ( config: ActivityCommon, fn: K2<P1, P2, T> ): K2<P1, P2, T>
export function activity<P1, P2, P3, T> ( config: ActivityCommon, fn: K3<P1, P2, P3, T> ): K3<P1, P2, P3, T>
export function activity<P1, P2, P3, P4, T> ( config: ActivityCommon, fn: K4<P1, P2, P3, P4, T> ): K4<P1, P2, P3, P4, T>
export function activity<P1, P2, P3, P4, P5, T> ( config: ActivityCommon, fn: K5<P1, P2, P3, P4, P5, T> ): K5<P1, P2, P3, P4, P5, T>
export function activity<T> ( config: ActivityCommon, fn: ( ...args: any[] ) => Promise<T> ): Kleisli<T> {
  const newFn: ( ...args: any[] ) => Promise<T> = withRetry ( withThrottle ( fn, config.throttle ), config.retry )
  return newFn
}

