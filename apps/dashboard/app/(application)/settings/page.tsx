import { Header } from '@harmony/ui/src/components/core/header'
import { withAuth } from '../../../utils/protected-routes-hoc'

const SettingsPage = withAuth(() => {
  return <Header level={2}>Settings Page Coming Soon!</Header>
})

export default SettingsPage
