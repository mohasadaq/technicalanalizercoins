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
  SidebarInput,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Coin, PriceData } from '@/types';
import {
  analyzeGoldenCross,
  predictResistance,
  tradeRecommendationSummary,
  searchCoins,
  type AnalyzeGoldenCrossOutput,
  type PredictResistanceOutput,
  type TradeRecommendationSummaryOutput,
} from '@/app/actions';
import { getHistoricalData } from '@/lib/data';
import { Logo } from './icons';
import { PriceChart } from './price-chart';
import { AnalysisResults } from './analysis-results';
import { Skeleton } from './ui/skeleton';
import { Bot, CandlestickChart, Github, Search } from 'lucide-react';

export function DashboardClient({ coins: initialCoins }: { coins: Coin[] }) {
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = React.useState<Coin | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [historicalData, setHistoricalData] = React.useState<{ prices: PriceData[]; dataString: string, currentPrice: number } | null>(null);
  const [analysis, setAnalysis] = React.useState<AnalyzeGoldenCrossOutput | null>(null);
  const [resistance, setResistance] = React.useState<PredictResistanceOutput | null>(null);
  const [recommendation, setRecommendation] = React.useState<TradeRecommendationSummaryOutput | null>(null);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, startSearchTransition] = React.useTransition();
  const [displayedCoins, setDisplayedCoins] = React.useState<Coin[]>(initialCoins);
  
  const [timeframe, setTimeframe] = React.useState(30);
  const timeframes = [
    { label: '1D', value: 1 },
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ];

  React.useEffect(() => {
    setDisplayedCoins(initialCoins);
  }, [initialCoins]);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedCoins(initialCoins);
      return;
    }
    
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        startSearchTransition(async () => {
          const results = await searchCoins(searchQuery);
          setDisplayedCoins(results);
        });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, initialCoins]);

  const handleCoinSelect = (coin: Coin) => {
    if (selectedCoin?.id === coin.id) return;

    setSelectedCoin(coin);
    setHistoricalData(null);
    setAnalysis(null);
    setResistance(null);
    setRecommendation(null);
    setSearchQuery('');
  };
  
  React.useEffect(() => {
    if (!selectedCoin) return;

    startTransition(async () => {
      try {
        const data = await getHistoricalData(selectedCoin.id, timeframe);
        setHistoricalData(data);

        const analysisResult = await analyzeGoldenCross({
          coinName: selectedCoin.name,
          historicalData: data.dataString,
          timeframeDays: timeframe,
        });
        setAnalysis(analysisResult);

        if (analysisResult && analysisResult.analysis) {
          const resistanceResult = await predictResistance({
            coinTicker: selectedCoin.ticker,
            referencePrice: analysisResult.suggestedTradePrice || data.currentPrice,
            analysisContext: analysisResult.analysis,
          });
          setResistance(resistanceResult);
          
          const recommendationResult = await tradeRecommendationSummary({
            initialAnalysis: analysisResult.analysis,
            resistancePrediction: resistanceResult.reasoning,
            currentPrice: data.currentPrice,
          });
          setRecommendation(recommendationResult);
        } else {
          setResistance(null);
          setRecommendation(null);
        }

      } catch (error) {
        console.error('Analysis failed:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: `Could not perform analysis for ${selectedCoin.name}. This coin may not be supported.`,
        });
        setSelectedCoin(null);
      }
    });
  }, [selectedCoin, timeframe]);


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">Gold Predictor</h1>
          </div>
          <div className="relative mt-2">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <SidebarInput
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {isSearching ? (
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : displayedCoins.length > 0 ? (
                displayedCoins.map((coin) => (
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
                ))
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found.
                </div>
            )}
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
          {(isPending && !isSearching) && <DashboardSkeleton />}
          {!isPending && !selectedCoin && <WelcomeMessage />}
          {!isPending && selectedCoin && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedCoin.name} Analysis
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
                    {timeframes.map((tf) => (
                        <Button
                            key={tf.value}
                            variant={timeframe === tf.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTimeframe(tf.value)}
                            disabled={isPending}
                        >
                            {tf.label}
                        </Button>
                    ))}
                </div>
              </div>

              {historicalData ? (
                <PriceChart 
                  priceData={historicalData.prices} 
                  resistanceLevels={resistance?.resistanceLevels} 
                  suggestedTradePrice={analysis?.suggestedTradePrice}
                />
              ) : (isPending && <Skeleton className="aspect-video w-full" />)}
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
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-1/3" />
        <div className="flex gap-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-9 w-12" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
