import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
 
const allowedOrigins: string[] = [];

const publicApis = [/\/api\/load/, /\/api\/update/, /\/api\/github\/callback/, /\/api\/trpc\/setup\.getRepositories/, /\/api\/trpc\/setup\.connectRepository/];

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  beforeAuth(req) {
    // retrieve the current response
    const res = NextResponse.next()

    if (!publicApis.some(matcher => matcher.test(req.url))) {
      return res;
    }

    // retrieve the HTTP "Origin" header 
    // from the incoming request
    const origin = req.headers.get("origin") ?? ''

    res.headers.append('Access-Control-Allow-Origin', "*");

    // add the remaining CORS headers to the response
    res.headers.append('Access-Control-Allow-Credentials', "true")
    res.headers.append('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    res.headers.append(
        'Access-Control-Allow-Headers',
        'Origin, X-CSRF-Token, X-Requested-With, Accept, Authorization, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    return res
  },
  apiRoutes(req) {
    if (publicApis.some(matcher => matcher.test(req.url))) {
      return false;
    }

    return ['/api/(.*)', '/trpc/(.*)'].some(matcher => new RegExp(matcher).test(req.url));
  },
	publicRoutes: [...publicApis, /\/setup\/developer/]
});
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};