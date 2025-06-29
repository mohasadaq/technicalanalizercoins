'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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
} satisfies ChartConfig;

export function PriceChart({ priceData, resistanceLevels, supportLevels, suggestedTradePrice, timeframe }: PriceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Chart</CardTitle>
        <CardDescription>
          Historical price data with short-term and long-term moving averages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-video h-[300px] w-full lg:h-[400px]">
          <ResponsiveContainer>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
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
                domain={['dataMin * 0.95', 'dataMax * 1.1']}
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <ChartLegend content={<ChartLegendContent indicator="line" />} />
              <Tooltip
                cursorClassName="fill-muted/20"
                content={<ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    if (timeframe <= 1) {
                        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                    }
                    return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                  }}
                  />}
              />
              <Area
                dataKey="price"
                type="monotone"
                fill="url(#fillPrice)"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                dataKey="ma_short"
                type="monotone"
                fill="transparent"
                stroke="var(--color-ma_short)"
                strokeWidth={1.5}
                dot={false}
              />
               <Area
                dataKey="ma_long"
                type="monotone"
                fill="transparent"
                stroke="var(--color-ma_long)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />

              {suggestedTradePrice && (
                  <ReferenceLine
                    y={suggestedTradePrice}
                    stroke="hsl(var(--accent))"
                    strokeDasharray="6 6"
                    strokeWidth={1.5}
                  >
                     <YAxis.Label value="Suggested Entry" position="insideTopRight" fill="hsl(var(--accent))" fontSize={12} fontWeight="bold" />
                  </ReferenceLine>
              )}

              {resistanceLevels?.map((level, index) => (
                <ReferenceLine 
                  key={`res-${index}`} 
                  y={level} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="4 4"
                  strokeWidth={1}
                >
                  <YAxis.Label value={`R${index + 1}`} position="insideTopLeft" fill="hsl(var(--destructive))" fontSize={12} fontWeight="bold" />
                </ReferenceLine>
              ))}

              {supportLevels?.map((level, index) => (
                <ReferenceLine 
                  key={`sup-${index}`} 
                  y={level} 
                  stroke="hsl(var(--chart-2))" 
                  strokeDasharray="4 4"
                  strokeWidth={1}
                >
                  <YAxis.Label value={`S${index + 1}`} position="insideBottomRight" fill="hsl(var(--chart-2))" fontSize={12} fontWeight="bold"/>
                </ReferenceLine>
              ))}

            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
