import type { Metadata } from 'next'
import './global.css'
import { HarmonySetup } from 'harmony-ai-editor/src'
import { ClerkProvider } from '@clerk/nextjs'
import { fonts, mulish } from '@harmony/util/src/fonts'
import { TrpcProvider } from '../utils/trpc-provider'

const repositoryId =
  process.env.REPOSITORY_ID || 'fbefdac4-8370-4d6d-b440-0307882f0102'

export const metadata: Metadata = {
  title: 'Harmony UI',
  description: 'Manage your Harmony projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <TrpcProvider>
        <html className='hw-h-full hw-bg-white hw-dark' lang='en'>
          <body
            className={`${mulish.className} hw-h-full hw-bg-white dark:hw-bg-gray-900`}
          >
            {children}
            {process.env.ENV === 'staging' ? (
              <HarmonySetup
                repositoryId='da286f25-b5de-4003-94ed-2944162271ed'
                fonts={fonts}
                environment='staging'
                overlay
              />
            ) : null}
            {process.env.ENV === 'development' ? (
              <HarmonySetup
                repositoryId={repositoryId}
                fonts={fonts}
                environment='development'
                overlay
              />
            ) : null}
            {/* <Script id="harmony-tag" src="bundle.js"></Script>
							<Script>
							{`(function() {
								const script = document.getElementById('harmony-tag');
								script.addEventListener('load', function() {
									window.HarmonyProvider({repositoryId:'clrf5dxjg000169tj4bwcrjj0'});
								});
								})()`}
							</Script> */}
          </body>
        </html>
      </TrpcProvider>
    </ClerkProvider>
  )
}
