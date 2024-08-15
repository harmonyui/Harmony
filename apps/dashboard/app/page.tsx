import { redirect } from 'next/navigation'
import { withAuth } from '../utils/protected-routes-hoc'

const Home = withAuth(() => {
  redirect('/projects')
})

export default Home
