import type { Metadata } from 'next'
import Head from 'next/head'

export const metadata: Metadata = {
  title: 'Tidarr',
  description: 'Unofficial Tital media downloader',
  icons: [{
    rel: "icon",
    url: "favicon.svg"
  }, {
    rel: "apple-touch-icon",
    url: "favicon.svg"
  }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
