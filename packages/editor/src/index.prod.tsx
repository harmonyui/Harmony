import { HarmonySetup } from './components/harmony-setup'
import { HarmonyProviderFunc } from './index'
import './global.css'

export { HarmonySetup }

if (typeof window !== 'undefined') {
  window.HarmonyProvider = HarmonyProviderFunc
}

if (module.hot) {
  module.hot.accept('./components/harmony-setup', () => {
    // const { HarmonyProviderFunc: NewHarmonyProviderFunc } = import('./index');
    // window.HarmonyProvider = NewHarmonyProviderFunc;
    // // Optionally, you can re-initialize or re-render the application here
    // if (window.HarmonyProvider) {
    //     window.HarmonyProvider({branchId: 'asdf', repositoryId: 'asdf'}, ); // Call the new provider function to reinitialize your script
    // }
    console.log('starting reload...')
    // void import('./components/harmony-setup').then(({HarmonySetup: NewHarmonySetup}) => {
    //     console.log('reloaded! Yes!')
    //     ReactDOM.render(<NewHarmonySetup repositoryId="asdf"/>, document.body);
    // });
  })
}
