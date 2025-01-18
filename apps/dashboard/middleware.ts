import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const publicApis = [
  /\/api\/github\/callback/,
  /\/api\/trpc\/setup\.getRepositories/,
  /\/api\/email/,
  /\/api\/trpc\/setup\.connectRepository/,
]
const isPublicApi = createRouteMatcher(publicApis)

const isPublicRoute = createRouteMatcher([/\/setup\/developer/, ...publicApis])

const configureCookies = (req: NextRequest) => {
  // retrieve the current response
  const res = NextResponse.next()

  const url = new URL(req.url)
  const mirrorId = url.searchParams.get('mirror-id')
  if (mirrorId) {
    res.cookies.set('harmony-user-id', mirrorId)
  }

  if (!isPublicApi(req)) {
    return res
  }

  // retrieve the HTTP "Origin" header
  // from the incoming request
  //const origin = req.headers.get('origin') ?? ''

  res.headers.append('Access-Control-Allow-Origin', '*')

  // add the remaining CORS headers to the response
  res.headers.append('Access-Control-Allow-Credentials', 'true')
  res.headers.append(
    'Access-Control-Allow-Methods',
    'GET,DELETE,PATCH,POST,PUT',
  )
  res.headers.append(
    'Access-Control-Allow-Headers',
    'Origin, X-CSRF-Token, X-Requested-With, Accept, Authorization, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  )

  return res
}

export default clerkMiddleware(async (auth, request) => {
  const res = await configureCookies(request)

  if (!isPublicRoute(request)) {
    await auth.protect()

    res.cookies.delete('harmony-user-id')
    return res
  }

  return res
})

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
// export default authMiddleware({
//   beforeAuth(req) {
//     // retrieve the current response
//     const res = NextResponse.next()

//     const url = new URL(req.url)
//     const mirrorId = url.searchParams.get('mirror-id')
//     if (mirrorId) {
//       res.cookies.set('harmony-user-id', mirrorId)
//     }

//     if (!publicApis.some((matcher) => matcher.test(req.url))) {
//       return res
//     }

//     // retrieve the HTTP "Origin" header
//     // from the incoming request
//     //const origin = req.headers.get('origin') ?? ''

//     res.headers.append('Access-Control-Allow-Origin', '*')

//     // add the remaining CORS headers to the response
//     res.headers.append('Access-Control-Allow-Credentials', 'true')
//     res.headers.append(
//       'Access-Control-Allow-Methods',
//       'GET,DELETE,PATCH,POST,PUT',
//     )
//     res.headers.append(
//       'Access-Control-Allow-Headers',
//       'Origin, X-CSRF-Token, X-Requested-With, Accept, Authorization, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
//     )

//     return res
//   },
//   afterAuth(auth, req) {
//     if (!auth.userId && !auth.isPublicRoute) {
//       const res = redirectToSignIn({ returnBackUrl: req.url }) as NextResponse
//       res.cookies.delete('harmony-user-id')

//       return res
//     }

//     // If the user is signed in and trying to access a protected route, allow them to access route
//     if (auth.userId && !auth.isPublicRoute) {
//       return NextResponse.next()
//     }

//     return NextResponse.next()
//   },
//   apiRoutes(req) {
//     if (publicApis.some((matcher) => matcher.test(req.url))) {
//       return false
//     }

//     return ['/api/(.*)', '/trpc/(.*)'].some((matcher) =>
//       new RegExp(matcher).test(req.url),
//     )
//   },
//   publicRoutes: [...publicApis, /\/setup\/developer/],
// })

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
