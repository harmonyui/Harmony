import { Environment, getWebUrl } from '@harmony/util/src/utils/component'

export const AuthUrl = {
  getAuthUrlBase(environment: Environment): string {
    return getWebUrl(environment)
  },
  getAuthUrl(environment: Environment, tabId: number): string {
    const base = this.getAuthUrlBase(environment)

    return `${base}/auth?tabId=${tabId}`
  },
}
