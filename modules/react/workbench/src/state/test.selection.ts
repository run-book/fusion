
export type ReqRespAction = 'Summary' |
  'TaskRequestInput' | 'RequestTranform' | 'ServiceRequestInput' |
  'ServiceResponseOutput' | 'ResponseTransform' | 'TaskResponseOutput'

export const reqRespOptions: ReqRespAction[] = [
  'Summary',
  'TaskRequestInput', 'RequestTranform', 'ServiceRequestInput',
  'ServiceResponseOutput', 'ResponseTransform', 'TaskResponseOutput',
]
export const summary: ReqRespAction = 'Summary'
export const taskRequestInput: ReqRespAction = 'TaskRequestInput'
export const requestTranform: ReqRespAction = 'RequestTranform'
export const serviceRequestInput: ReqRespAction = 'ServiceRequestInput'
export const serviceResponseOutput: ReqRespAction = 'ServiceResponseOutput'
export const responseTransform: ReqRespAction = 'ResponseTransform'
export const taskResponseOutput: ReqRespAction = 'TaskResponseOutput'
