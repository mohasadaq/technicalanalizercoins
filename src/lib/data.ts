import type { Coin, PriceData } from "@/types";

const coins: Coin[] = [
  { id: "btc", name: "Bitcoin", ticker: "BTC" },
  { id: "eth", name: "Ethereum", ticker: "ETH" },
  { id: "sol", name: "Solana", ticker: "SOL" },
  { id: "xrp", name: "XRP", ticker: "XRP" },
];

export function getCoins(): Coin[] {
  return coins;
}

export function getHistoricalData(coinId: string): { prices: PriceData[], dataString: string, currentPrice: number } {
  const basePrice = coinId === 'btc' ? 68000 : coinId === 'eth' ? 3500 : coinId === 'sol' ? 150 : 0.5;
  const prices: PriceData[] = [];
  let dataString = 'Date,Price,50_day_ma,200_day_ma\n';
  
  const today = new Date();
  const goldenCrossPoint = 45; // Days ago

  for (let i = 250; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Simulate price fluctuation
    const priceFluctuation = (Math.sin(i / 20) * 0.1 + (Math.random() - 0.5) * 0.05) + (250 - i) / 250 * 0.2;
    const price = basePrice * (1 + priceFluctuation);

    // Simulate 50-day and 200-day moving averages to create a golden cross
    let fiftyDayMA;
    if (i > goldenCrossPoint) {
      fiftyDayMA = price * (0.95 - (i - goldenCrossPoint) / 250 * 0.1);
    } else {
      fiftyDayMA = price * (1.05 + (goldenCrossPoint - i) / 250 * 0.1);
    }

    const twoHundredDayMA = price * 0.98;
    
    const record = {
      date: dateString,
      price: parseFloat(price.toFixed(2)),
      '50_day_ma': parseFloat(fiftyDayMA.toFixed(2)),
      '200_day_ma': parseFloat(twoHundredDayMA.toFixed(2)),
    };
    
    prices.push(record);
    dataString += `${record.date},${record.price},${record['50_day_ma']},${record['200_day_ma']}\n`;
  }
  
  const currentPrice = prices[prices.length - 1].price;
  return { prices, dataString, currentPrice };
}
