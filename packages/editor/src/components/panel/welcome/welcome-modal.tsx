/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare -- ok*/

import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { Header } from '@harmony/ui/src/components/core/header'
import { useEffect, useMemo, useState } from 'react'
import { getEditorUrl } from '@harmony/util/src/utils/component'
import { Button } from '@harmony/ui/src/components/core/button'
import { InfoBox } from '@harmony/ui/src/components/core/alert'
import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { useHarmonyContext } from '../../harmony-context'
import { useHarmonyStore } from '../../hooks/state'

export const WelcomeModal: React.FunctionComponent = () => {
  const showWelcomeScreen = useHarmonyStore((state) => state.showWelcomeScreen)
  const updateWelcomeScreen = useHarmonyStore(
    (state) => state.updateWelcomeScreen,
  )
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (typeof showWelcomeScreen === 'number') {
      setPage(showWelcomeScreen)
    }
  }, [showWelcomeScreen])

  const pages: PageComponent[] = [WelcomeScreen, VideoScreen]
  const onNext = () => {
    const nextPage = page + 1
    if (nextPage >= pages.length) {
      updateWelcomeScreen(false)
    } else {
      setPage(page + 1)
    }
  }

  const Page = pages[page]

  return (
    <HarmonyModal
      maxWidthClassName='hw-max-w-5xl'
      show={showWelcomeScreen === true || typeof showWelcomeScreen === 'number'}
      onClose={() => {
        updateWelcomeScreen(false)
      }}
      editor
    >
      <div className='hw-flex hw-flex-col hw-text-center hw-gap-4'>
        <Page onNext={onNext} />
      </div>
    </HarmonyModal>
  )
}

type PageComponent = React.FunctionComponent<{ onNext: () => void }>

const WelcomeScreen: PageComponent = ({ onNext }) => {
  const { environment } = useHarmonyContext()
  const EDITOR_URL = useMemo(() => getEditorUrl(environment), [environment])
  return (
    <>
      <Header level={1}>Welcome to Harmony</Header>
      <p>
        You are one of the world’s first visual developers. You have as much
        freedom as a dev with access to the codebase, without needing any
        technical experience.
      </p>
      <div className='hw-h-40 hw-mx-auto'>
        <img className='hw-h-full' src={`${EDITOR_URL}/Harmony_logo.svg`} />
      </div>
      <div className='hw-flex hw-gap-4 hw-items-center hw-justify-around'>
        <p>
          We have loaded a sample project for you to play around with. Let’s get
          started with the ultra-simple controls!
        </p>
        <div>
          <Button className='hw-h-fit' onClick={onNext}>
            Get Started
          </Button>
        </div>
      </div>
    </>
  )
}

export const ControlModal: React.FunctionComponent<{
  show: boolean
  onClose: () => void
}> = ({ show, onClose }) => {
  return (
    <HarmonyModal
      maxWidthClassName='hw-max-w-5xl'
      show={show}
      onClose={onClose}
      editor
    >
      <div className='hw-flex hw-flex-col hw-text-center hw-gap-4'>
        <Header level={1}>Harmony Control Guide:</Header>
        <ControlGrid />
      </div>
    </HarmonyModal>
  )
}

const VideoScreen: PageComponent = ({ onNext }) => {
  return (
    <>
      <Header level={1}>Harmony Demo Video:</Header>
      <div className='mx-auto'>
        <iframe
          width='560'
          height='315'
          src='https://www.youtube.com/embed/Irhfe1aME0s?si=uFEtL0JbGAdI13d2'
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          referrerPolicy='strict-origin-when-cross-origin'
          allowFullScreen
        ></iframe>
      </div>
      <div className='hw-flex hw-gap-4 hw-items-center hw-justify-end'>
        <div>
          <Button className='hw-h-fit' onClick={onNext}>
            Get Started
          </Button>
        </div>
      </div>
    </>
  )
}

// const ControlScreen: PageComponent = ({onNext}) => {
//     return (<>
//         <Header level={1}>Harmony Control Guide:</Header>
//         <ControlGrid/>
//         <div className="hw-flex hw-gap-4 hw-items-center hw-justify-around">
//             <p>We have loaded a sample project for you to play around with. Let’s get started with the ultra-simple controls!</p>
//             <div>
//                 <Button className="hw-h-fit" onClick={onNext}>Get Started</Button>
//             </div>
//         </div>
//     </>)
// }

const ControlGrid = () => {
  return (
    <>
      <InfoBox type='info'>
        <div className='hw-grid hw-grid-cols-6 hw-gap-x-6 hw-text-left hw-items-center'>
          <ControlGridRow
            title='Parents and Children'
            description='Each site is organized into “parents” and “children”, much like how cities belong to a county, counties in a state, etc. Whenever you select an element, Harmony will highlight its parent. You cannot drag a child outside its parent. '
            control={<ParentChildSvg />}
          />
        </div>
      </InfoBox>
      <div className='hw-grid hw-grid-cols-6 hw-gap-y-4 hw-text-left'>
        <ControlGridRow
          title='Select, Drag, Resize, Zoom'
          description='You can select, drag, resize, and zoom in Harmony with your cursor and touchpad, much like Figma and Canva.'
          control='[Cursor]'
        />
        <ControlGridRow
          title='Toggle Navigation/Designer modes'
          description='Use T to toggle between Harmony’s two modes. Navigation allows you to navigate the site as normal, and designer mode allows you to make changes.'
          control='[T]'
        />
        <ControlGridRow
          title='Move to parent component'
          description='Press Esc to move from the selected component to its parent. Use this to help you understand how the site is constructed.'
          control='[Esc]'
        />
        <ControlGridRow
          title='Interact with selected component'
          description='As custom sites can get complex, press alt or option if you need to drag or resize a selected element whose boundaries are too close to its parent or child.'
          control='[Alt]'
        />
        <ControlGridRow
          title='Toggle component flex'
          description='Harmony’s flex tool gives you the choice between more responsive code and more flexible controls. Press F to toggle the parent of the selected component between Flex and non-Flex properties. '
          control='[F]'
        />
      </div>
    </>
  )
}

const ControlGridRow: React.FunctionComponent<{
  title: string
  description: string
  control: React.ReactNode
}> = ({ title, description, control }) => {
  return (
    <>
      <div className='hw-col-span-2'>{title}</div>
      <div className='hw-col-span-3 hw-text-xs'>{description}</div>
      <div className='hw-col-span-1 hw-text-center'>{control}</div>
    </>
  )
}

const ParentChildSvg: IconComponent = () => {
  return (
    <svg
      width='120'
      height='60'
      viewBox='0 0 207 102'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect
        x='34.2539'
        y='40.9038'
        width='48.7108'
        height='42.0602'
        stroke='#0094FF'
        stroke-width='2'
      />
      <rect
        x='129.023'
        y='40.9038'
        width='48.7108'
        height='42.0602'
        stroke='#0094FF'
        stroke-width='2'
      />
      <rect
        x='1'
        y='22.6143'
        width='205'
        height='77.8072'
        stroke='#0094FF'
        stroke-opacity='0.5'
        stroke-width='2'
        stroke-dasharray='4 4'
      />
      <path
        d='M44.9973 67.5085C43.9373 67.5085 43.0373 67.2885 42.2973 66.8485C41.5573 66.4085 40.9873 65.7835 40.5873 64.9735C40.1973 64.1635 40.0023 63.1985 40.0023 62.0785C40.0023 60.9585 40.1973 59.9985 40.5873 59.1985C40.9873 58.3885 41.5573 57.7635 42.2973 57.3235C43.0373 56.8835 43.9373 56.6635 44.9973 56.6635C45.7473 56.6635 46.4173 56.7785 47.0073 57.0085C47.5973 57.2385 48.1123 57.5735 48.5523 58.0135L48.0873 59.0035C47.6073 58.5835 47.1323 58.2785 46.6623 58.0885C46.1923 57.8885 45.6423 57.7885 45.0123 57.7885C43.8023 57.7885 42.8823 58.1635 42.2523 58.9135C41.6223 59.6635 41.3073 60.7185 41.3073 62.0785C41.3073 63.4385 41.6223 64.4985 42.2523 65.2585C42.8823 66.0085 43.8023 66.3835 45.0123 66.3835C45.6423 66.3835 46.1923 66.2885 46.6623 66.0985C47.1323 65.8985 47.6073 65.5835 48.0873 65.1535L48.5523 66.1585C48.1123 66.5885 47.5973 66.9235 47.0073 67.1635C46.4173 67.3935 45.7473 67.5085 44.9973 67.5085ZM50.5112 67.3735V56.3335H51.7262V61.5085H51.5312C51.7412 60.9185 52.0912 60.4735 52.5812 60.1735C53.0812 59.8635 53.6562 59.7085 54.3062 59.7085C55.2062 59.7085 55.8762 59.9535 56.3162 60.4435C56.7562 60.9235 56.9762 61.6535 56.9762 62.6335V67.3735H55.7612V62.7085C55.7612 62.0085 55.6212 61.4985 55.3412 61.1785C55.0712 60.8585 54.6312 60.6985 54.0212 60.6985C53.3212 60.6985 52.7612 60.9135 52.3412 61.3435C51.9312 61.7735 51.7262 62.3385 51.7262 63.0385V67.3735H50.5112ZM59.3002 67.3735V59.8435H60.5152V67.3735H59.3002ZM59.1502 58.1335V56.7685H60.6502V58.1335H59.1502ZM62.8745 67.3735V56.3335H64.0895V67.3735H62.8745ZM69.2987 67.5085C68.6387 67.5085 68.0587 67.3535 67.5587 67.0435C67.0587 66.7235 66.6687 66.2735 66.3887 65.6935C66.1187 65.1135 65.9837 64.4185 65.9837 63.6085C65.9837 62.7885 66.1187 62.0885 66.3887 61.5085C66.6687 60.9285 67.0587 60.4835 67.5587 60.1735C68.0587 59.8635 68.6387 59.7085 69.2987 59.7085C69.9787 59.7085 70.5637 59.8785 71.0537 60.2185C71.5537 60.5585 71.8887 61.0185 72.0587 61.5985H71.8787V56.3335H73.0937V67.3735H71.8937V65.5735H72.0587C71.8987 66.1735 71.5687 66.6485 71.0687 66.9985C70.5687 67.3385 69.9787 67.5085 69.2987 67.5085ZM69.5537 66.5185C70.2637 66.5185 70.8337 66.2735 71.2637 65.7835C71.6937 65.2835 71.9087 64.5585 71.9087 63.6085C71.9087 62.6485 71.6937 61.9235 71.2637 61.4335C70.8337 60.9335 70.2637 60.6835 69.5537 60.6835C68.8437 60.6835 68.2737 60.9335 67.8437 61.4335C67.4237 61.9235 67.2137 62.6485 67.2137 63.6085C67.2137 64.5585 67.4237 65.2835 67.8437 65.7835C68.2737 66.2735 68.8437 66.5185 69.5537 66.5185Z'
        fill='#11283B'
      />
      <path
        d='M139.769 67.5085C138.709 67.5085 137.809 67.2885 137.069 66.8485C136.329 66.4085 135.759 65.7835 135.359 64.9735C134.969 64.1635 134.774 63.1985 134.774 62.0785C134.774 60.9585 134.969 59.9985 135.359 59.1985C135.759 58.3885 136.329 57.7635 137.069 57.3235C137.809 56.8835 138.709 56.6635 139.769 56.6635C140.519 56.6635 141.189 56.7785 141.779 57.0085C142.369 57.2385 142.884 57.5735 143.324 58.0135L142.859 59.0035C142.379 58.5835 141.904 58.2785 141.434 58.0885C140.964 57.8885 140.414 57.7885 139.784 57.7885C138.574 57.7885 137.654 58.1635 137.024 58.9135C136.394 59.6635 136.079 60.7185 136.079 62.0785C136.079 63.4385 136.394 64.4985 137.024 65.2585C137.654 66.0085 138.574 66.3835 139.784 66.3835C140.414 66.3835 140.964 66.2885 141.434 66.0985C141.904 65.8985 142.379 65.5835 142.859 65.1535L143.324 66.1585C142.884 66.5885 142.369 66.9235 141.779 67.1635C141.189 67.3935 140.519 67.5085 139.769 67.5085ZM145.283 67.3735V56.3335H146.498V61.5085H146.303C146.513 60.9185 146.863 60.4735 147.353 60.1735C147.853 59.8635 148.428 59.7085 149.078 59.7085C149.978 59.7085 150.648 59.9535 151.088 60.4435C151.528 60.9235 151.748 61.6535 151.748 62.6335V67.3735H150.533V62.7085C150.533 62.0085 150.393 61.4985 150.113 61.1785C149.843 60.8585 149.403 60.6985 148.793 60.6985C148.093 60.6985 147.533 60.9135 147.113 61.3435C146.703 61.7735 146.498 62.3385 146.498 63.0385V67.3735H145.283ZM154.072 67.3735V59.8435H155.287V67.3735H154.072ZM153.922 58.1335V56.7685H155.422V58.1335H153.922ZM157.646 67.3735V56.3335H158.861V67.3735H157.646ZM164.07 67.5085C163.41 67.5085 162.83 67.3535 162.33 67.0435C161.83 66.7235 161.44 66.2735 161.16 65.6935C160.89 65.1135 160.755 64.4185 160.755 63.6085C160.755 62.7885 160.89 62.0885 161.16 61.5085C161.44 60.9285 161.83 60.4835 162.33 60.1735C162.83 59.8635 163.41 59.7085 164.07 59.7085C164.75 59.7085 165.335 59.8785 165.825 60.2185C166.325 60.5585 166.66 61.0185 166.83 61.5985H166.65V56.3335H167.865V67.3735H166.665V65.5735H166.83C166.67 66.1735 166.34 66.6485 165.84 66.9985C165.34 67.3385 164.75 67.5085 164.07 67.5085ZM164.325 66.5185C165.035 66.5185 165.605 66.2735 166.035 65.7835C166.465 65.2835 166.68 64.5585 166.68 63.6085C166.68 62.6485 166.465 61.9235 166.035 61.4335C165.605 60.9335 165.035 60.6835 164.325 60.6835C163.615 60.6835 163.045 60.9335 162.615 61.4335C162.195 61.9235 161.985 62.6485 161.985 63.6085C161.985 64.5585 162.195 65.2835 162.615 65.7835C163.045 66.2735 163.615 66.5185 164.325 66.5185Z'
        fill='#11283B'
      />
      <path
        d='M76.9704 15V4.425H81.2754C82.3854 4.425 83.2404 4.695 83.8404 5.235C84.4404 5.765 84.7404 6.505 84.7404 7.455C84.7404 8.385 84.4404 9.125 83.8404 9.675C83.2404 10.215 82.3854 10.485 81.2754 10.485H78.2154V15H76.9704ZM78.2154 9.45H81.1554C81.9254 9.45 82.5054 9.275 82.8954 8.925C83.2954 8.575 83.4954 8.085 83.4954 7.455C83.4954 6.815 83.2954 6.32 82.8954 5.97C82.5054 5.62 81.9254 5.445 81.1554 5.445H78.2154V9.45ZM89.1047 15.135C88.4347 15.135 87.8497 14.98 87.3497 14.67C86.8497 14.35 86.4597 13.9 86.1797 13.32C85.9097 12.74 85.7747 12.045 85.7747 11.235C85.7747 10.415 85.9097 9.715 86.1797 9.135C86.4597 8.555 86.8497 8.11 87.3497 7.8C87.8497 7.49 88.4347 7.335 89.1047 7.335C89.7847 7.335 90.3697 7.51 90.8597 7.86C91.3597 8.2 91.6897 8.665 91.8497 9.255H91.6697L91.8347 7.47H93.0047C92.9747 7.76 92.9447 8.055 92.9147 8.355C92.8947 8.645 92.8847 8.93 92.8847 9.21V15H91.6697V13.23H91.8347C91.6747 13.82 91.3447 14.285 90.8447 14.625C90.3447 14.965 89.7647 15.135 89.1047 15.135ZM89.3447 14.145C90.0647 14.145 90.6347 13.9 91.0547 13.41C91.4747 12.91 91.6847 12.185 91.6847 11.235C91.6847 10.275 91.4747 9.55 91.0547 9.06C90.6347 8.56 90.0647 8.31 89.3447 8.31C88.6347 8.31 88.0647 8.56 87.6347 9.06C87.2147 9.55 87.0047 10.275 87.0047 11.235C87.0047 12.185 87.2147 12.91 87.6347 13.41C88.0647 13.9 88.6347 14.145 89.3447 14.145ZM95.2038 15V9.285C95.2038 8.985 95.1938 8.68 95.1738 8.37C95.1638 8.06 95.1438 7.76 95.1138 7.47H96.2838L96.4338 9.3L96.2238 9.315C96.3238 8.865 96.4988 8.495 96.7488 8.205C96.9988 7.915 97.2938 7.7 97.6338 7.56C97.9738 7.41 98.3288 7.335 98.6988 7.335C98.8488 7.335 98.9788 7.34 99.0888 7.35C99.2088 7.36 99.3188 7.385 99.4188 7.425L99.4038 8.505C99.2538 8.455 99.1138 8.425 98.9838 8.415C98.8638 8.395 98.7238 8.385 98.5638 8.385C98.1238 8.385 97.7388 8.49 97.4088 8.7C97.0888 8.91 96.8438 9.18 96.6738 9.51C96.5138 9.84 96.4338 10.19 96.4338 10.56V15H95.2038ZM103.94 15.135C102.76 15.135 101.83 14.795 101.15 14.115C100.47 13.425 100.13 12.47 100.13 11.25C100.13 10.46 100.28 9.775 100.58 9.195C100.88 8.605 101.3 8.15 101.84 7.83C102.38 7.5 103 7.335 103.7 7.335C104.39 7.335 104.97 7.48 105.44 7.77C105.91 8.06 106.27 8.475 106.52 9.015C106.77 9.545 106.895 10.175 106.895 10.905V11.355H101.06V10.59H106.1L105.845 10.785C105.845 9.985 105.665 9.36 105.305 8.91C104.945 8.46 104.41 8.235 103.7 8.235C102.95 8.235 102.365 8.5 101.945 9.03C101.525 9.55 101.315 10.255 101.315 11.145V11.28C101.315 12.22 101.545 12.935 102.005 13.425C102.475 13.905 103.13 14.145 103.97 14.145C104.42 14.145 104.84 14.08 105.23 13.95C105.63 13.81 106.01 13.585 106.37 13.275L106.79 14.13C106.46 14.45 106.04 14.7 105.53 14.88C105.03 15.05 104.5 15.135 103.94 15.135ZM108.754 15V9.21C108.754 8.93 108.739 8.645 108.709 8.355C108.689 8.055 108.664 7.76 108.634 7.47H109.804L109.954 9.12H109.774C109.994 8.54 110.344 8.1 110.824 7.8C111.314 7.49 111.879 7.335 112.519 7.335C113.409 7.335 114.079 7.575 114.529 8.055C114.989 8.525 115.219 9.27 115.219 10.29V15H114.004V10.365C114.004 9.655 113.859 9.14 113.569 8.82C113.289 8.49 112.849 8.325 112.249 8.325C111.549 8.325 110.994 8.54 110.584 8.97C110.174 9.4 109.969 9.975 109.969 10.695V15H108.754ZM120.213 15.135C119.473 15.135 118.908 14.925 118.518 14.505C118.128 14.075 117.933 13.43 117.933 12.57V8.415H116.463V7.47H117.933V5.415L119.148 5.07V7.47H121.308V8.415H119.148V12.435C119.148 13.035 119.248 13.465 119.448 13.725C119.658 13.975 119.968 14.1 120.378 14.1C120.568 14.1 120.738 14.085 120.888 14.055C121.038 14.015 121.173 13.97 121.293 13.92V14.94C121.153 15 120.983 15.045 120.783 15.075C120.593 15.115 120.403 15.135 120.213 15.135Z'
        fill='#11283B'
      />
    </svg>
  )
}
