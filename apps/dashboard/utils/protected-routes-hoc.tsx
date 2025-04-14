import { type GetServerSideProps } from 'next'
import type { FullSession, Session } from '@harmony/server/src/auth'
import { getServerAuthSession } from '@harmony/server/src/auth'
import { notFound, redirect } from 'next/navigation'
import type { AuthContext } from '@harmony/server/src/api/trpc'
import { prisma } from '@harmony/db/lib/prisma'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { mailer } from '@harmony/server/src/api'
import { Workspace } from '@harmony/util/src/types/branch'
import { getWorkspace } from '@harmony/server/src/api/repository/database/workspace'

interface RequireRouteProps {
  redirect: string
  check?: (session: Session) => boolean
}
export const requireRoute =
  ({ redirect, check }: RequireRouteProps) =>
  () =>
  async (mockUserId?: string) => {
    const { userId } = await auth()
    const session = await getServerAuthSession(userId, mockUserId)

    if (!session?.auth || !session.account || (check && check(session))) {
      return { redirect, session: undefined }
    }

    return { session: session as FullSession, redirect: undefined }
  }

// export const isNotRole =
//   <T>(desiredRole: UserRole, transform?: (obj: T) => UserRole) =>
//   (obj: T | UserRole) => {
//     const result = UserRoleSchema.safeParse(obj);
//     const role: UserRole | Error = result.success
//       ? result.data
//       : transform === undefined
//       ? Error("must provide transform method")
//       : transform(obj as T);
//     if (role instanceof Error) {
//       throw role;
//     }
//     return role !== desiredRole && role !== "admin";
//   };

export const requireAuth = requireRoute({
  redirect: '/setup',
  check: (session) => {
    return session.account === undefined
  },
})

export interface AuthProps {
  ctx: AuthContext
}
interface PageProps {
  params: Promise<Record<string, string>>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
export const withAuth =
  (
    Component: React.FunctionComponent<AuthProps & PageProps>,
  ): React.FunctionComponent<PageProps> =>
  async (pageProps) => {
    const cookie = await cookies()
    const mockUserId = cookie.get('harmony-user-id')
    const response = await requireAuth()(mockUserId?.value)

    if (response.redirect) {
      redirect('/setup')
    }

    return (
      <Component
        ctx={{ prisma, session: response.session!, mailer }}
        {...pageProps}
      />
    )
  }

export const withWorkspace = (
  Component: React.FunctionComponent<
    AuthProps & PageProps & { workspace: Workspace }
  >,
): React.FunctionComponent<PageProps> => {
  return withAuth(async (props) => {
    const { workspaceId } = await props.params
    const workspace = await getWorkspace({
      prisma: props.ctx.prisma,
      workspaceId,
    })
    if (!workspace) {
      notFound()
    }
    return <Component {...props} workspace={workspace} />
  })
}

// export const requireRole = (role: UserRole) =>
//   requireRoute({
//     redirect: "/",
//     check: isNotRole(role, (session) => session.user.role),
//   });

export const defaultGetServerProps: GetServerSideProps = () =>
  new Promise((resolve) => {
    resolve({ props: {} })
  })
