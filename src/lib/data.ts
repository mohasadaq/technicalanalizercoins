import type { Coin, PriceData } from "@/types";

const coins: Coin[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
  { id: "ethereum", name: "Ethereum", ticker: "ETH" },
  { id: "solana", name: "Solana", ticker: "SOL" },
  { id: "ripple", name: "XRP", ticker: "XRP" },
];

export function getCoins(): Coin[] {
  return coins;
}

function calculateMA(data: number[], windowSize: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
            result.push(undefined);
        } else {
            const window = data.slice(i - windowSize + 1, i + 1);
            const sum = window.reduce((a, b) => a + b, 0);
            result.push(sum / windowSize);
        }
    }
    return result;
}

export async function getHistoricalData(coinId: string): Promise<{ prices: PriceData[], dataString: string, currentPrice: number }> {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=250&interval=daily`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from CoinGecko API: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.prices || data.prices.length === 0) {
            throw new Error("No price data available from API.");
        }

        const priceData: {date: Date, price: number}[] = data.prices.map((p: [number, number]) => ({
            date: new Date(p[0]),
            price: p[1]
        }));
        
        const justPrices = priceData.map(p => p.price);
        const fiftyDayMA = calculateMA(justPrices, 50);
        const twoHundredDayMA = calculateMA(justPrices, 200);

        const prices: PriceData[] = priceData.map((p, i) => ({
            date: p.date.toISOString().split('T')[0],
            price: parseFloat(p.price.toFixed(2)),
            '50_day_ma': fiftyDayMA[i] !== undefined ? parseFloat(fiftyDayMA[i]!.toFixed(2)) : undefined,
            '200_day_ma': twoHundredDayMA[i] !== undefined ? parseFloat(twoHundredDayMA[i]!.toFixed(2)) : undefined,
        }));

        let dataString = 'Date,Price,50_day_ma,200_day_ma\n';
        prices.forEach(p => {
            dataString += `${p.date},${p.price},${p['50_day_ma'] !== undefined ? p['50_day_ma'] : ''},${p['200_day_ma'] !== undefined ? p['200_day_ma'] : ''}\n`;
        });
        
        const currentPrice = prices[prices.length - 1].price;
        
        return { prices, dataString, currentPrice };

    } catch (error) {
        console.error("Error fetching historical data:", error);
        throw new Error("Could not fetch historical data.");
    }
}
