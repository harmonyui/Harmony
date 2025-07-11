import type { Metadata } from 'next'
import './global.css'
import { HarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global-provider'
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
        <html className='h-full bg-white dark' lang='en'>
          <body
            className={`${mulish.className} h-full bg-white dark:bg-gray-900`}
          >
            {children}
            {process.env.ENV === 'staging' ? (
              <HarmonySetup
                repositoryId={repositoryId}
                fonts={fonts}
                environment='staging'
                overlay
                user={{
                  id: '123',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john.doe@example.com',
                  imageUrl: 'https://example.com/image.png',
                }}
              />
            ) : null}
            {process.env.ENV === 'development' ? (
              <HarmonySetup
                repositoryId={repositoryId}
                fonts={fonts}
                environment='development'
                overlay
                user={{
                  id: '123',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john.doe@example.com',
                  imageUrl: 'https://example.com/image.png',
                }}
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
