import { HarmonySetup, useHarmonySetup } from './components/harmony-setup'
import './global.css'
import './global-provider'

export { HarmonySetup, useHarmonySetup }

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
