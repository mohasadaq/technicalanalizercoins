'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { PriceData } from '@/types';

interface PriceChartProps {
  priceData: PriceData[];
  resistanceLevels?: number[];
  suggestedTradePrice?: number;
}

const chartConfig = {
  price: {
    label: 'Price (USD)',
    color: 'hsl(var(--primary))',
  },
  '50_day_ma': {
    label: '50-Day MA',
    color: 'hsl(var(--chart-2))',
  },
  '200_day_ma': {
    label: '200-Day MA',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function PriceChart({ priceData, resistanceLevels, suggestedTradePrice }: PriceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price and Moving Averages</CardTitle>
        <CardDescription>
          Historical price data showing the 50-day and 200-day moving averages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-video h-[400px] w-full">
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
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin * 0.95', 'dataMax * 1.05']}
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Tooltip
                content={<ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => 
                    (name === 'price' || name === '50_day_ma' || name === '200_day_ma') 
                    ? `$${Number(value).toLocaleString()}` 
                    : value
                  }
                  />}
              />
              <Area
                dataKey="price"
                type="natural"
                fill="url(#fillPrice)"
                stroke="var(--color-price)"
                stackId="a"
              />
              <Area
                dataKey="50_day_ma"
                type="natural"
                fill="transparent"
                stroke="var(--color-50_day_ma)"
                strokeWidth={2}
                dot={false}
                stackId="b"
              />
               <Area
                dataKey="200_day_ma"
                type="natural"
                fill="transparent"
                stroke="var(--color-200_day_ma)"
                strokeWidth={2}
                dot={false}
                stackId="c"
              />

              {suggestedTradePrice && (
                  <ReferenceLine
                    y={suggestedTradePrice}
                    stroke="var(--color-accent)"
                    strokeDasharray="3 3"
                  >
                     <YAxis.Label value="Golden Cross Price" position="insideTopRight" fill="hsl(var(--accent))" fontSize={12} />
                  </ReferenceLine>
              )}

              {resistanceLevels?.map((level, index) => (
                <ReferenceLine 
                  key={index} 
                  y={level} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                >
                  <YAxis.Label value={`Resistance ${index + 1}`} position="insideTopLeft" fill="hsl(var(--destructive))" fontSize={12} />
                </ReferenceLine>
              ))}

            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
