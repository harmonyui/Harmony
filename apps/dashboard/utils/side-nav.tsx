"use client";
import { useClerk } from "@clerk/nextjs";
import {
  GitBranchIcon,
  GitPullRequestIcon,
  UserGroupIcon,
} from "@harmony/ui/src/components/core/icons";
import type {
  SidePanelItems,
  ProfileItem,
} from "@harmony/ui/src/components/core/side-panel";
import { SidePanel } from "@harmony/ui/src/components/core/side-panel";
import { useRouter, usePathname } from "next/navigation";

interface SideNavProps {
  children: React.ReactNode;
}
export const SideNav: React.FunctionComponent<SideNavProps> = ({
  children,
}) => {
  const { user, signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  if (!user?.fullName) return;

  const items: SidePanelItems[] = [
    {
      label: "Projects",
      href: "/projects",
      current: pathname.includes("projects"),
      icon: GitBranchIcon,
    },
    {
      label: "Publish Requests",
      href: "/pull-requests",
      current: pathname.includes("pull-requests"),
      icon: GitPullRequestIcon,
    },
    {
      label: "My Team",
      href: "/team",
      current: pathname.includes("team"),
      icon: UserGroupIcon,
    },
  ];
  const profileItem: ProfileItem = {
    name: user.firstName || user.fullName,
    img: user.imageUrl,
    navigation: [
      {
        name: "Sign Out",
        onClick() {
          signOut(() => {
            router.push("/");
          });
        },
      },
    ],
  };
  return (
    <SidePanel items={items} title="Harmony" profileItem={profileItem}>
      {children}
    </SidePanel>
  );
};
