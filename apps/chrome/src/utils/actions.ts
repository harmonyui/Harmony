import { dispatchToggleEvent } from 'harmony-ai-editor/src/hooks/toggle-event'
import { Clerk } from './clerk'
import { createAuthTab } from './create-auth-tab'
import { updateActiveTab } from './listeners'
import { Storage } from './storage'

export enum Actions {
  InitEditor = 'extensionIconClicked',
  GetToken = 'getToken',
  SetCookie = 'setCookie',
  GetUser = 'getUser',
  AuthTab = 'authTab',
}

export const actionHandlers = {
  [Actions.GetToken]: async () => {
    const cookie = await Storage.getCookie()

    if (!cookie) {
      console.error('No cookie found')
      return null
    }

    return Clerk.getToken(cookie)
  },
  [Actions.SetCookie]: async ({
    cookie,
    tabId,
  }: {
    cookie: string
    tabId?: number
  }) => {
    await Storage.setCookie(cookie)

    if (tabId) {
      updateActiveTab(tabId)
    }
  },
  [Actions.GetUser]: async () => {
    const cookie = await Storage.getCookie()

    if (!cookie) {
      return null
    }

    return Clerk.getUser(cookie)
  },
  [Actions.AuthTab]: async ({ tabId }: { tabId: number }) => {
    createAuthTab(tabId)
  },
  [Actions.InitEditor]: async ({ tabId }: { tabId: number }) => {
    dispatchToggleEvent(tabId)

    return { status: 'action performed' }
  },
} as const satisfies Record<Actions, (payload: any) => Promise<any>>

export type ActionHandler<A extends Actions> = (typeof actionHandlers)[A]
export type PayloadForAction<A extends Actions> = Parameters<
  ActionHandler<A>
>[0]
export type ReturnTypeForAction<A extends Actions> = Awaited<
  ReturnType<ActionHandler<A>>
>
