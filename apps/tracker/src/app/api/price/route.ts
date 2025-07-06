import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 업비트 API를 사용해서 비트코인 시세 조회 (KRW-BTC)
    const response = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC", {
      next: { revalidate: 60 }, // 1분 캐시
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Bitcoin price from Upbit");
    }

    const data = await response.json();
    const bitcoinData = data[0]; // 배열의 첫 번째 요소

    return NextResponse.json({
      price: bitcoinData.trade_price, // 현재가
      timestamp: new Date(bitcoinData.trade_time_utc).getTime(), // UTC 시간을 밀리초로 변환
      change: bitcoinData.change, // EVEN, RISE, FALL
      changeRate: bitcoinData.change_rate, // 변화율
      changePrice: bitcoinData.change_price, // 변화가격
      high: bitcoinData.high_price, // 고가
      low: bitcoinData.low_price, // 저가
      volume: bitcoinData.acc_trade_volume_24h, // 24시간 거래량
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch Bitcoin price" }, { status: 500 });
  }
}
