import { User } from 'harmony-ai-editor/src/utils/types'
import { cookieParser, parseJwt } from './utils'

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
  async getToken(cookie: string): Promise<string | null> {
    const cookieData = cookieParser(cookie)
    const jwtResult = parseJwt<{ sid: string }>(cookieData.__session)

    try {
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
    } catch (err) {
      console.error(err)
      return null
    }
  },
  async getUser(cookie: string): Promise<User | null> {
    const cookieData = cookieParser(cookie)
    const jwtResult = parseJwt<{ sid: string }>(cookieData.__session)

    const response = await fetch(
      `${this.baseUrl}/v1/client/sessions/${jwtResult.sid}?__dev_session=${cookieData.__clerk_db_jwt}`,
      {
        method: 'GET',
      },
    )

    if (!response.ok) {
      console.error('Failed to fetch user data')
      return null
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
