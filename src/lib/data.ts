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

function calculateRSI(prices: number[], period: number = 14): (number | undefined)[] {
    const rsi: (number | undefined)[] = new Array(prices.length).fill(undefined);
    if (prices.length <= period) {
        return rsi;
    }

    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    let gain = 0;
    let loss = 0;
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) {
            gain += changes[i];
        } else {
            loss -= changes[i];
        }
    }

    let avgGain = gain / period;
    let avgLoss = loss / period;
    
    if (avgLoss === 0) {
        rsi[period] = 100;
    } else {
        const rs = avgGain / avgLoss;
        rsi[period] = 100 - (100 / (1 + rs));
    }

    for (let i = period; i < changes.length; i++) {
        const change = changes[i];
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - change) / period;
        }
        
        if (avgLoss === 0) {
            rsi[i + 1] = 100;
        } else {
            const rs = avgGain / avgLoss;
            rsi[i + 1] = 100 - (100 / (1 + rs));
        }
    }
    return rsi;
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
        
        const volumeData: {date: Date, volume: number}[] = data.total_volumes.map((v: [number, number]) => ({
            date: new Date(v[0]),
            volume: v[1]
        }));

        const alignedData = new Map<number, {price?: number; volume?: number}>();
        priceData.forEach(p => {
            const time = p.date.getTime();
            if (!alignedData.has(time)) alignedData.set(time, {});
            alignedData.get(time)!.price = p.price;
        });
        volumeData.forEach(v => {
            const time = v.date.getTime();
            // Find the closest timestamp in prices to align volume data
            const closestPriceTime = [...alignedData.keys()].reduce((prev, curr) => 
                Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
            );
            if (!alignedData.has(closestPriceTime)) alignedData.set(closestPriceTime, {});
            alignedData.get(closestPriceTime)!.volume = v.volume;
        });

        const sortedTimestamps = Array.from(alignedData.keys()).sort((a, b) => a - b);

        const justPrices: number[] = [];
        const processedData: {date: Date; price: number; volume: number;}[] = [];

        sortedTimestamps.forEach(ts => {
            const d = alignedData.get(ts)!;
            if (d.price !== undefined && d.volume !== undefined) {
                justPrices.push(d.price);
                processedData.push({
                    date: new Date(ts),
                    price: d.price,
                    volume: d.volume,
                });
            }
        });

        const fiftyDayMA = calculateMA(justPrices, 50);
        const twoHundredDayMA = calculateMA(justPrices, 200);
        const rsiValues = calculateRSI(justPrices, 14);

        const prices: PriceData[] = processedData.map((p, i) => ({
            date: days <= 1 ? p.date.toISOString() : p.date.toISOString().split('T')[0],
            price: parseFloat(p.price.toFixed(2)),
            volume: parseFloat(p.volume.toFixed(0)),
            rsi: rsiValues[i] !== undefined ? parseFloat(rsiValues[i]!.toFixed(2)) : undefined,
            'ma_short': fiftyDayMA[i] !== undefined ? parseFloat(fiftyDayMA[i]!.toFixed(2)) : undefined,
            'ma_long': twoHundredDayMA[i] !== undefined ? parseFloat(twoHundredDayMA[i]!.toFixed(2)) : undefined,
        }));

        let dataString = 'Date,Price,ma_short,ma_long,volume,rsi\n';
        prices.forEach(p => {
            const dateForPrompt = days <= 1 ? new Date(p.date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short'}) : p.date;
            dataString += `${dateForPrompt},${p.price},${p['ma_short'] ?? ''},${p['ma_long'] ?? ''},${p.volume ?? ''},${p.rsi ?? ''}\n`;
        });
        
        const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;
        
        return { prices, dataString, currentPrice };

    } catch (error) {
        console.error("Error fetching historical data:", error);
        throw new Error("Could not fetch historical data.");
    }
}
