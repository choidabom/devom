import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

export const metadata: Metadata = {
  title: "Archive",
  description: "Archiving from devom",
  icons: {
    icon: "/icon/devom.svg",
    shortcut: "/icon/devom.svg",
    apple: "/icon/devom.svg",
  },
}

const pretendard = localFont({
  src: [
    {
      path: "../../public/fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
  preload: true,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  )
}
