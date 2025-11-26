import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "devom",
  description: "devom's archive",
  icons: {
    icon: "/icon/devom.svg",
  },
  openGraph: {
    title: "devom",
    description: "devom's archive",
    images: ["/image/wip.png"],
    siteName: "devom's archive",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <Script src="https://www.clarity.ms/tag/u8wftcm4ae" strategy="lazyOnload" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
