import { DeveloperSetup } from '../../components/setup'

const clientId = process.env.GITHUB_APP_CLIENT_ID || ''
const DeveloperSetupPage = async ({
  params,
}: {
  params: Promise<{ teamId: string }>
}) => {
  const { teamId } = await params

  return (
    <DeveloperSetup
      repository={undefined}
      teamId={teamId}
      clientId={clientId}
    />
  )
}

export default DeveloperSetupPage
