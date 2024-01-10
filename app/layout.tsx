import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { HarmonyProvider } from '@harmony/components/harmony-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { TrpcProvider } from '@harmony/utils/trpc-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
		<ClerkProvider>
			<TrpcProvider>
				<html className="h-full bg-white" lang="en">
					<body className={`${inter.className} h-full`}>
						<HarmonyProvider>
							
							{children}
						</HarmonyProvider>
					</body>
				</html>
			</TrpcProvider>
		</ClerkProvider>
  )
}
