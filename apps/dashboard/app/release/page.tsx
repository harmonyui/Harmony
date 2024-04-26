import { ChangeLogList } from "@harmony/ui/src/components/features/change-log";
import { withAuth } from "../../../../utils/protected-routes-hoc";
import { SideNav } from "../../../../utils/side-nav";
import { prisma } from "../../../../src/server/db";
import { ChangeLog } from "@harmony/ui/src/types/change-log";

const ReleasePage = withAuth(async () => {
    const changeLog = await prisma.changeLog.findMany({
        orderBy: {
            release_date: "desc"
        }
    });

    const items = changeLog.map<ChangeLog>(log => ({
        releaseDate: log.release_date,
        bugs: log.bugs,
        features: log.features,
        version: log.version
    }));
    
    return <SideNav>
        <ChangeLogList items={items}/>
    </SideNav>
});

export default ReleasePage;