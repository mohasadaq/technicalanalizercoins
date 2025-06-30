'use client';

import * as React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { PriceData } from '@/types';

interface PriceChartProps {
  priceData: PriceData[];
  resistanceLevels?: number[];
  supportLevels?: number[];
  suggestedTradePrice?: number;
  timeframe: number;
}

const chartConfig = {
  price: {
    label: 'Price',
    color: 'hsl(var(--chart-1))',
  },
  ma_short: {
    label: 'Short MA',
    color: 'hsl(var(--chart-2))',
  },
  ma_long: {
    label: 'Long MA',
    color: 'hsl(var(--chart-4))',
  },
  volume: {
    label: 'Volume',
    color: 'hsl(var(--muted-foreground))',
  },
  rsi: {
    label: 'RSI',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

const syncId = "synced-charts";

export function PriceChart({ priceData, resistanceLevels, supportLevels, suggestedTradePrice, timeframe }: PriceChartProps) {
    const formattedData = priceData.map(d => ({
        ...d,
        volume: d.volume ? Number(d.volume) / 1_000_000 : 0 // Format volume in millions
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = new Date(label);
        const formattedLabel = timeframe <= 1 
            ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const priceItem = payload.find((p: any) => p.dataKey === 'price');
      const maShortItem = payload.find((p: any) => p.dataKey === 'ma_short');
      const maLongItem = payload.find((p: any) => p.dataKey === 'ma_long');
      const volumeItem = payload.find((p: any) => p.dataKey === 'volume');
      const rsiItem = payload.find((p: any) => p.dataKey === 'rsi');

      return (
        <div className="rounded-lg border bg-background p-2.5 shadow-sm text-sm">
            <p className="font-bold mb-1">{formattedLabel}</p>
            {priceItem && <p style={{ color: 'hsl(var(--chart-1))' }}>Price: {`$${priceItem.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>}
            {maShortItem?.value && <p style={{ color: 'hsl(var(--chart-2))' }}>Short MA: {`$${maShortItem.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>}
            {maLongItem?.value && <p style={{ color: 'hsl(var(--chart-4))' }}>Long MA: {`$${maLongItem.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>}
            {volumeItem?.value > 0 && <p className="text-muted-foreground">Volume (M): {`$${volumeItem.value.toFixed(2)}`}</p>}
            {rsiItem?.value && <p style={{ color: 'hsl(var(--chart-5))' }}>RSI: {`${rsiItem.value.toFixed(2)}`}</p>}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Chart</CardTitle>
        <CardDescription>
          Price, Volume, RSI, and Moving Averages for {timeframe}-day period.
        </CardDescription>
      </CardHeader>
      <CardContent className="pr-1">
        <div className="grid h-[550px] w-full gap-4">
            {/* Price Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceData} syncId={syncId} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={() => ''} height={10} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    orientation="right"
                    domain={['dataMin * 0.95', 'dataMax * 1.05']}
                    tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <ChartLegend content={<ChartLegendContent indicator="line" />} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Area dataKey="price" type="monotone" fill="url(#fillPrice)" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                  <Area dataKey="ma_short" type="monotone" fill="transparent" stroke="var(--color-ma_short)" strokeWidth={1.5} dot={false} />
                  <Area dataKey="ma_long" type="monotone" fill="transparent" stroke="var(--color-ma_long)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  {suggestedTradePrice && <ReferenceLine y={suggestedTradePrice} stroke="hsl(var(--accent))" strokeDasharray="6 6" strokeWidth={1.5} label={{ value: "Entry", position: "insideTopRight", fill: "hsl(var(--accent))", fontSize: 12, fontWeight: 'bold' }} />}
                  {resistanceLevels?.map((level, index) => <ReferenceLine key={`res-${index}`} y={level} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={1} label={{ value: `R${index + 1}`, position: "insideTopLeft", fill: "hsl(var(--destructive))", fontSize: 12, fontWeight: 'bold' }} />)}
                  {supportLevels?.map((level, index) => <ReferenceLine key={`sup-${index}`} y={level} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" strokeWidth={1} label={{ value: `S${index + 1}`, position: "insideBottomRight", fill: "hsl(var(--chart-2))", fontSize: 12, fontWeight: 'bold' }}/>)}
                </AreaChart>
            </ResponsiveContainer>
            
            {/* Volume Chart */}
            <ResponsiveContainer width="100%" height={100}>
                <BarChart data={formattedData} syncId={syncId} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={() => ''} height={10} />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        orientation="right"
                        domain={[0, 'dataMax * 4']}
                        tickFormatter={(value) => `$${value}M`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--muted), 0.3)' }} />
                    <Bar dataKey="volume" fill="hsla(var(--foreground), 0.2)" />
                </BarChart>
            </ResponsiveContainer>

            {/* RSI Chart */}
            <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={priceData} syncId={syncId} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          if (timeframe <= 1) {
                            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                          }
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        orientation="right"
                        domain={[0, 100]}
                        ticks={[10, 30, 50, 70, 90]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={1} />
                    <ReferenceLine y={30} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" strokeWidth={1} />
                    <Area dataKey="rsi" type="monotone" fill="transparent" stroke="var(--color-rsi)" strokeWidth={1.5} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
