import type { Coin, PriceData } from "@/types";

export async function getCoins(): Promise<Coin[]> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
    if (!response.ok) {
      throw new Error(`Failed to fetch top coins from CoinGecko API: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      ticker: c.symbol.toUpperCase(),
    }));
  } catch (error) {
    console.error("Error fetching top coins:", error);
    // Fallback to a static list if API fails
    return [
      { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
      { id: "ethereum", name: "Ethereum", ticker: "ETH" },
      { id: "solana", name: "Solana", ticker: "SOL" },
      { id: "ripple", name: "XRP", ticker: "XRP" },
    ];
  }
}

export async function searchCoins(query: string): Promise<Coin[]> {
    if (!query.trim()) {
        return [];
    }
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from CoinGecko API: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.coins) {
            return [];
        }
        const searchResults: Coin[] = data.coins.map((c: any) => ({
            id: c.id,
            name: c.name,
            ticker: c.symbol.toUpperCase(),
        }));
        return searchResults.slice(0, 20);
    } catch (error) {
        console.error("Error searching coins:", error);
        return [];
    }
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

export async function getHistoricalData(coinId: string, days: number = 30): Promise<{ prices: PriceData[], dataString: string, currentPrice: number }> {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
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
            date: days <= 1 ? p.date.toISOString() : p.date.toISOString().split('T')[0],
            price: parseFloat(p.price.toFixed(2)),
            'ma_short': fiftyDayMA[i] !== undefined ? parseFloat(fiftyDayMA[i]!.toFixed(2)) : undefined,
            'ma_long': twoHundredDayMA[i] !== undefined ? parseFloat(twoHundredDayMA[i]!.toFixed(2)) : undefined,
        }));

        let dataString = 'Date,Price,ma_short,ma_long\n';
        prices.forEach(p => {
            const dateForPrompt = days <= 1 ? new Date(p.date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short'}) : p.date;
            dataString += `${dateForPrompt},${p.price},${p['ma_short'] !== undefined ? p['ma_short'] : ''},${p['ma_long'] !== undefined ? p['ma_long'] : ''}\n`;
        });
        
        const currentPrice = prices[prices.length - 1].price;
        
        return { prices, dataString, currentPrice };

    } catch (error) {
        console.error("Error fetching historical data:", error);
        throw new Error("Could not fetch historical data.");
    }
}
