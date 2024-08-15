export function parseJwt<T>(token: string): T {
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

export function cookieParser(cookieString: string) {
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
