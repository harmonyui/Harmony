import { DeveloperSetup } from "@harmony/ui/src/components/features/setup";

const clientId = process.env.GITHUB_APP_CLIENT_ID || '';
const DeveloperSetupPage = ({params}: {params: {teamId: string}}) => {
    const {teamId} = params;
    
    return <DeveloperSetup repository={undefined} teamId={teamId} clientId={clientId}/>
}

export default DeveloperSetupPage;