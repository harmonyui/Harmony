import { ChatBubble } from '@harmony/util/src/types/branch'
import { ComponentUpdate } from '@harmony/util/src/types/component'

type State = {
  updates: ComponentUpdate[]
  chatBubbles: ChatBubble[]
}

const state: Record<string, State> = {}

export const getState = <KEY extends keyof State>(
  path: string,
  key: KEY,
): State[KEY] => {
  let ret = state[path]
  if (!ret) {
    ret = {
      updates: [],
      chatBubbles: [],
    }
    state[path] = ret
  }
  return ret[key]
}

export const setState = <KEY extends keyof State>(
  path: string,
  key: KEY,
  value: State[KEY],
) => {
  state[path][key] = value
}

export const resetState = (path: string) => {
  state[path] = {
    updates: [],
    chatBubbles: [],
  }
}
