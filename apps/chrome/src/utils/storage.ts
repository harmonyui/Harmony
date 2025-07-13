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
