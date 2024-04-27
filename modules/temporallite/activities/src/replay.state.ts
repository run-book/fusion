
export type SuccessfulReplayItem = {
  id: string
  success: any
}
export function isSuccessfulReplayItem<T> ( item: ReplayItem ): item is SuccessfulReplayItem {
  return (item as SuccessfulReplayItem).success !== undefined
}
export type FailedReplayItem = {
  id: string
  failure: any
}
export function isFailedReplayItem ( item: ReplayItem ): item is FailedReplayItem {
  return (item as FailedReplayItem).failure !== undefined
}
export type ReplayItem = SuccessfulReplayItem | FailedReplayItem
export type ReplayState = ReplayItem[]
