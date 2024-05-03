import {  withAuth } from "../utils/protected-routes-hoc";
import { redirect } from "next/navigation";

const Home = withAuth(() => {
	redirect('/projects');
})

export default Home;

//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "Account" TO STDOUT WITH (FORMAT CSV, HEADER);' > Account.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "ComponentSettings" TO STDOUT WITH (FORMAT CSV, HEADER);' > ComponentSettings.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "EditableData" TO STDOUT WITH (FORMAT CSV, HEADER);' > EditableData.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "Logging" TO STDOUT WITH (FORMAT CSV, HEADER);' > Logging.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "Page" TO STDOUT WITH (FORMAT CSV, HEADER);' > Page.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "Session" TO STDOUT WITH (FORMAT CSV, HEADER);' > Session.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "TimelineCategory" TO STDOUT WITH (FORMAT CSV, HEADER);' > TimelineCategory.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "TimelineItem" TO STDOUT WITH (FORMAT CSV, HEADER);' > TimelineItem.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "User" TO STDOUT WITH (FORMAT CSV, HEADER);' > User.csv
//psql postgres://default:CYUB4V2hsxve@ep-floral-queen-a6pjljye-pooler.us-west-2.aws.neon.tech:5432/verceldb -c 'COPY "VerificationToken" TO STDOUT WITH (FORMAT CSV, HEADER);' > VerificationToken.csv

