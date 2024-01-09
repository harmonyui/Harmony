import { GetServerSidePropsContext, type GetServerSideProps } from "next";
import { Session, getServerAuthSession } from "@harmony/server/auth";

interface RequireRouteProps {
  redirect: string;
  check?: (session: Session) => boolean;
}
export const requireRoute =
  ({ redirect, check }: RequireRouteProps) =>
  () =>
  async () => {
    const session = await getServerAuthSession();

    if (!session?.auth || (check && check(session))) {
      return {
        redirect: {
          destination: redirect, // login path
          permanent: false,
        },
      };
    }

		return {
			redirect: undefined
		}
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

// export const requireRole = (role: UserRole) =>
//   requireRoute({
//     redirect: "/",
//     check: isNotRole(role, (session) => session.user.role),
//   });

export const defaultGetServerProps: GetServerSideProps = () =>
  new Promise((resolve) => {
    resolve({ props: {} });
  });