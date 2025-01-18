import { HarmonySetup } from './components/harmony-setup'
import './global.css'
import { QueryStateProvider } from '@harmony/ui/src/hooks/query-state'
import { getClass } from '@harmony/util/src/utils/common'
import { useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HarmonyProviderProps,
  HarmonyProvider,
} from './components/harmony-provider'

export { HarmonySetup }

export function HarmonyProviderFunc(
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) {
  const Container: React.FunctionComponent<{
    harmonyContainer: HTMLElement
    className: string
  }> = ({ className }) => {
    const ref = useRef<HTMLBodyElement>(null)
    useEffect(() => {
      if (ref.current) {
        options.setup.setContainer(ref.current)
        //options.setup.changeMode(options.mode || 'designer')
      }
    }, [ref])
    return (
      <section
        id='harmony-section'
        className={className}
        ref={ref}
        style={{ backgroundColor: 'white' }}
      ></section>
    )
  }
  const container = (
    <Container
      harmonyContainer={harmonyContainer}
      className={getClass(document.body.className, 'hw-select-none')}
    />
  ) //document.createElement('body');
  const root = createRoot(harmonyContainer)

  root.render(
    <QueryStateProvider>
      <HarmonyProvider {...options}>{container}</HarmonyProvider>
    </QueryStateProvider>,
  )
}

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
