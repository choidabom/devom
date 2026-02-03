import type { Metadata } from "next"
import Script from "next/script"
import type { ReactNode } from "react"

import { Providers } from "@/app/providers"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://devom.dev"),
  title: "devom",
  description: "devom's archive",
  icons: {
    icon: "/icon/devom.svg",
  },
  openGraph: {
    type: "website",
    url: "https://devom.dev",
    siteName: "devom",
    images: ["/image/wip.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script src="https://www.clarity.ms/tag/u8wftcm4ae" strategy="lazyOnload" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
