import { BitcoinDashboard } from "@/components/BitcoinDashboard";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">
          ₿ Tracker
        </h1>
        <p className="text-center text-muted-foreground">
          투자 기록과 수익률을 한눈에 관리하는 비트코인 가계부
        </p>
      </div>
      <BitcoinDashboard />
    </main>
  );
}
