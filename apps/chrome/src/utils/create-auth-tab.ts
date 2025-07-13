import { environment } from '@harmony/util/src/utils/component'
import { AuthUrl } from './auth-url'
import { createTab } from './listeners'

export const createAuthTab = (tabId: number) => {
  createTab(AuthUrl.getAuthUrl(environment, tabId))
}
