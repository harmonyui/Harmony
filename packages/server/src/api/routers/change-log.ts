import type { ChangeLog } from "@harmony/util/src/types/change-log";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const changeLogRouter = createTRPCRouter({
  getChangeLog: protectedProcedure.query(async ({ ctx }) => {
    const changeLog = await ctx.prisma.changeLog.findMany({
      orderBy: {
        release_date: "desc",
      },
    });

    return changeLog.map<ChangeLog>((log) => ({
      releaseDate: log.release_date,
      bugs: log.bugs,
      features: log.features,
      version: log.version,
    }));
  }),
});
