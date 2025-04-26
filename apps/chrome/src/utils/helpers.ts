import type { Environment } from '@harmony/util/src/utils/component'
import { getWebUrl } from '@harmony/util/src/utils/component'
import { cookieParser, parseJwt } from './utils'
import { User } from 'harmony-ai-editor/src/utils/types'

export const AuthUrl = {
  getAuthUrlBase(environment: Environment): string {
    return getWebUrl(environment)
  },
  getAuthUrl(environment: Environment, tabId: number): string {
    const base = this.getAuthUrlBase(environment)

    return `${base}/auth?tabId=${tabId}`
  },
}

export const Clerk = {
  baseUrl: 'https://neutral-mink-38.clerk.accounts.dev',
  buildGetTokenUrl({
    sessionId,
    dbJwt,
  }: {
    sessionId: string
    dbJwt: string
  }): string {
    return `${this.baseUrl}/v1/client/sessions/${sessionId}/tokens?__dev_session=${dbJwt}`
  },
  async getToken(cookie: string): Promise<string> {
    const cookieData = cookieParser(cookie)
    const jwtResult = parseJwt<{ sid: string }>(cookieData.__session)

    const response = await fetch(
      this.buildGetTokenUrl({
        sessionId: jwtResult.sid,
        dbJwt: cookieData.__clerk_db_jwt,
      }),
      {
        method: 'POST',
      },
    )

    const data = (await response.json()) as { jwt: string; object: 'token' }
    return data.jwt
  },
  async getUser(cookie: string): Promise<User> {
    const cookieData = cookieParser(cookie)
    const jwtResult = parseJwt<{ sid: string }>(cookieData.__session)

    const response = await fetch(
      `${this.baseUrl}/v1/client/sessions/${jwtResult.sid}?__dev_session=${cookieData.__clerk_db_jwt}`,
      {
        method: 'GET',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }

    const data = (await response.json()) as {
      response: {
        user: {
          id: string
          first_name: string
          last_name: string
          email_addresses: {
            email_address: string
          }[]
          image_url: string
        }
      }
    }
    return {
      id: data.response.user.id,
      firstName: data.response.user.first_name,
      lastName: data.response.user.last_name,
      email: data.response.user.email_addresses[0]?.email_address,
      imageUrl: data.response.user.image_url,
    }
  },
}

export const Storage = {
  getCookie(): Promise<string | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get('cookie', (result) => {
        resolve(result.cookie as string | undefined)
      })
    })
  },
  setCookie(cookie: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ cookie }, () => {
        resolve()
      })
    })
  },
}

export enum Actions {
  InitEditor = 'extensionIconClicked',
  GetToken = 'getToken',
  SetCookie = 'setCookie',
  GetUser = 'getUser',
}
// eslint-disable-next-line @typescript-eslint/no-namespace -- ok
export namespace ActionsPayload {
  export type InitEditor = object
  export type GetToken = object
  export interface SetCookie {
    cookie: string
    tabId: number
  }
}
