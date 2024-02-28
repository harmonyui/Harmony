import { GetServerSidePropsContext, type GetServerSideProps } from "next";
import { FullSession, Session, getServerAuthSession } from "../src/server/auth";
import { redirect } from "next/navigation";
import { AuthContext, mailer } from "../src/server/api/trpc";
import { prisma } from "../src/server/db";
import {cookies} from 'next/headers';

interface RequireRouteProps {
  redirect: string;
  check?: (session: Session) => boolean;
}
export const requireRoute =
  ({ redirect, check }: RequireRouteProps) =>
  () =>
  async (mockUserId?: string) => {
    const session = await getServerAuthSession(mockUserId);

    if (!session?.auth || !session.account || (check && check(session))) {
      return {redirect, session: undefined}
    }

		return {session: session as FullSession, redirect: undefined};
  };

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

export const requireAuth = requireRoute({ redirect: "/setup", check: (session) => {
	return session.account === undefined;
} });

type AuthProps = {ctx: AuthContext}
export const withAuth = (Component: React.FunctionComponent<AuthProps>): React.FunctionComponent<AuthProps> => 
	async (props) => {
    const cookie = cookies();
    const mockUserId = cookie.get('harmony-user-id');
    const response = await requireAuth()(mockUserId?.value);

		if (response.redirect) {
			redirect('/setup');
		}

		return <Component ctx={{prisma, session: response.session as FullSession, mailer}}/>
	}

// export const requireRole = (role: UserRole) =>
//   requireRoute({
//     redirect: "/",
//     check: isNotRole(role, (session) => session.user.role),
//   });

export const defaultGetServerProps: GetServerSideProps = () =>
  new Promise((resolve) => {
    resolve({ props: {} });
  });