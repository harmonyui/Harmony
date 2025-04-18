import type { Metadata } from 'next'
import './globals.css'
import { inter } from '@harmony/util/src/fonts'
import { DarkmodeHTML } from './components/dark-mode-toggle'

import 'harmony-ai-editor/src/global-provider'
import { Harmony } from './harmony'

export const metadata: Metadata = {
  title: 'Harmony UI',
  description: 'Make changes to your deployed app without a developer.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <DarkmodeHTML>
      <head>
        <link
          rel='stylesheet'
          href='https://api.fontshare.com/css?f%5B%5D=switzer@400,500,600,700&amp;display=swap'
        />
        <link
          rel='alternate'
          type='application/rss+xml'
          title='The Radiant Blog'
          href='/blog/feed.xml'
        />
      </head>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.className}`}
      >
        {children}
        <Harmony />
      </body>
    </DarkmodeHTML>
  )
}
