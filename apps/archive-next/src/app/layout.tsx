import "@/app/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive",
  description: "Archiving from devom",
  icons: {
    icon: "/icon/devom.svg",
    shortcut: "/icon/devom.svg",
    apple: "/icon/devom.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
