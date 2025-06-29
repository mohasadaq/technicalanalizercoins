'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getHistoricalData } from '@/lib/data';
import type { Coin, PriceData } from '@/types';
import {
  analyzeGoldenCross,
  predictResistance,
  tradeRecommendationSummary,
  type AnalyzeGoldenCrossOutput,
  type PredictResistanceOutput,
  type TradeRecommendationSummaryOutput,
} from '@/app/actions';
import { Logo } from './icons';
import { PriceChart } from './price-chart';
import { AnalysisResults } from './analysis-results';
import { Skeleton } from './ui/skeleton';
import { Bot, CandlestickChart, Github } from 'lucide-react';

export function DashboardClient({ coins }: { coins: Coin[] }) {
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = React.useState<Coin | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [historicalData, setHistoricalData] = React.useState<{ prices: PriceData[]; dataString: string, currentPrice: number } | null>(null);
  const [analysis, setAnalysis] = React.useState<AnalyzeGoldenCrossOutput | null>(null);
  const [resistance, setResistance] = React.useState<PredictResistanceOutput | null>(null);
  const [recommendation, setRecommendation] = React.useState<TradeRecommendationSummaryOutput | null>(null);

  const handleCoinSelect = (coin: Coin) => {
    if (selectedCoin?.id === coin.id) return;

    setSelectedCoin(coin);
    setHistoricalData(null);
    setAnalysis(null);
    setResistance(null);
    setRecommendation(null);

    startTransition(async () => {
      try {
        const data = getHistoricalData(coin.id);
        setHistoricalData(data);

        const analysisResult = await analyzeGoldenCross({
          coinName: coin.name,
          historicalData: data.dataString,
        });
        setAnalysis(analysisResult);

        if (analysisResult.goldenCrossDetected) {
          const resistanceResult = await predictResistance({
            coinTicker: coin.ticker,
            goldenCrossPrice: analysisResult.suggestedTradePrice || data.currentPrice,
            analysisContext: analysisResult.analysis,
          });
          setResistance(resistanceResult);
          
          const recommendationResult = await tradeRecommendationSummary({
            goldenCrossAnalysis: analysisResult.analysis,
            resistancePrediction: resistanceResult.reasoning,
            currentPrice: data.currentPrice,
          });
          setRecommendation(recommendationResult);
        }

      } catch (error) {
        console.error('Analysis failed:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not perform analysis for the selected coin.',
        });
      }
    });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">Gold Predictor</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {coins.map((coin) => (
              <SidebarMenuItem key={coin.id}>
                <SidebarMenuButton
                  onClick={() => handleCoinSelect(coin)}
                  isActive={selectedCoin?.id === coin.id}
                  disabled={isPending}
                >
                  <CandlestickChart />
                  <span>{coin.name} ({coin.ticker})</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" asChild>
            <a href="https://github.com/firebase/studio-examples" target="_blank">
              <Github />
              <span>Source Code</span>
            </a>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {isPending && <DashboardSkeleton />}
          {!isPending && !selectedCoin && <WelcomeMessage />}
          {!isPending && selectedCoin && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                {selectedCoin.name} Analysis
              </h2>
              {historicalData && (
                <PriceChart 
                  priceData={historicalData.prices} 
                  resistanceLevels={resistance?.resistanceLevels} 
                  suggestedTradePrice={analysis?.suggestedTradePrice}
                />
              )}
              <AnalysisResults
                analysis={analysis}
                resistance={resistance}
                recommendation={recommendation}
                coin={selectedCoin}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-border text-center p-8">
      <div className="flex items-center justify-center size-16 rounded-full bg-secondary mb-4">
        <Bot className="size-8 text-secondary-foreground" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight">Welcome to Binance Gold Predictor</h3>
      <p className="text-muted-foreground mt-2 max-w-md">
        Select a cryptocurrency from the sidebar to begin your AI-powered technical analysis and discover potential trading opportunities.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="aspect-video w-full" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
