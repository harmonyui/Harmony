import 'chrome'

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get('cookie', (result) => {
    const cookie = result.cookie as string | undefined
    if (!tab.id) {
      return
    }

    if (cookie) {
      void chrome.tabs.sendMessage(tab.id, {
        action: 'extensionIconClicked',
      })
    } else {
      void chrome.tabs.create({
        url: `http://localhost:3000/auth?tabId=${tab.id}`,
      })
    }
  })
})

function parseJwt<T>(token: string): T {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function d(c) {
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`
      })
      .join(''),
  )

  return JSON.parse(jsonPayload) as T
}

function cookieParser(cookieString: string) {
  // Return an empty object if cookieString
  // is empty
  if (cookieString === '') return {}

  // Get each individual key-value pairs
  // from the cookie string
  // This returns a new array
  const pairs = cookieString.split(';')

  // Separate keys from values in each pair string
  // Returns a new array which looks like
  // [[key1,value1], [key2,value2], ...]
  const splittedPairs = pairs.map((cookie) => cookie.split('='))

  // Create an object with all key-value pairs
  const cookieObj = splittedPairs.reduce<Record<string, string>>(
    (obj, cookie) => {
      // cookie[0] is the key of cookie
      // cookie[1] is the value of the cookie
      // decodeURIComponent() decodes the cookie
      // string, to handle cookies with special
      // characters, e.g. '$'.
      // string.trim() trims the blank spaces
      // auround the key and value.
      const key = decodeURIComponent(cookie[0].trim())
      obj[key] = decodeURIComponent(cookie[1].trim())

      return obj
    },
    {},
  )

  return cookieObj
}

type Messages =
  | {
      action: 'getToken'
    }
  | {
      action: 'setCookie'
      cookie: string
      tabId: string
    }
chrome.runtime.onMessage.addListener(
  (message: Messages, sender, sendResponse) => {
    if (message.action === 'getToken') {
      chrome.storage.local.get('cookie', (result) => {
        const cookie = cookieParser(result.cookie as string)

        const jwtResult = parseJwt<{ sid: string }>(cookie.__session)

        void fetch(
          `https://neutral-mink-38.clerk.accounts.dev/v1/client/sessions/${jwtResult.sid}/tokens?__dev_session=${cookie.__clerk_db_jwt}`,
          {
            method: 'POST',
          },
        )
          .then((response) => response.json())
          .then((data: { jwt: string; object: 'token' }) => {
            sendResponse(data.jwt)
          })
      })
    }

    if (message.action === 'setCookie') {
      const tabId = parseInt(message.tabId)
      chrome.storage.local.set({ cookie: message.cookie }, () => {
        chrome.tabs.sendMessage(
          tabId,
          { action: 'extensionIconClicked' },
          (response) => {
            console.log('response', response)
          },
        )
        chrome.tabs.update(tabId, { active: true }, () => {
          console.log('cookie set and tab updated')
        })
      })
    }

    return true
  },
)
