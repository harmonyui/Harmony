import { DeveloperSetup } from '../../components/setup'

const clientId = process.env.GITHUB_APP_CLIENT_ID || ''
const DeveloperSetupPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ workspaceName: string }>
}) => {
  const { workspaceName } = await searchParams

  return (
    <DeveloperSetup
      repository={undefined}
      workspaceName={workspaceName}
      clientId={clientId}
    />
  )
}

export default DeveloperSetupPage
