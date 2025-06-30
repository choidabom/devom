import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracker",
  description: "비트코인 가계부 - 투자 기록과 수익률을 관리하세요",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-background">{children}</div>
      </body>
    </html>
  );
}
