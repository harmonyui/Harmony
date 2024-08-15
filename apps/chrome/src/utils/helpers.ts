import type { Environment } from '@harmony/util/src/utils/component'
import { getWebUrl } from '@harmony/util/src/utils/component'
import { cookieParser, parseJwt } from './utils'

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
}
