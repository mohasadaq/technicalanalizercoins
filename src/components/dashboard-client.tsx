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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Coin, PriceData } from '@/types';
import {
  analyzeGoldenCross,
  predictResistance,
  predictSupport,
  tradeRecommendationSummary,
  searchCoins,
  type AnalyzeGoldenCrossOutput,
  type PredictResistanceOutput,
  type PredictSupportOutput,
  type TradeRecommendationSummaryOutput,
} from '@/app/actions';
import { getHistoricalData } from '@/lib/data';
import { Logo } from './icons';
import { PriceChart } from './price-chart';
import { AnalysisResults } from './analysis-results';
import { Skeleton } from './ui/skeleton';
import { Bot, CandlestickChart, Github, RefreshCw, Search } from 'lucide-react';

export function DashboardClient({ coins: initialCoins }: { coins: Coin[] }) {
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = React.useState<Coin | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [historicalData, setHistoricalData] = React.useState<{ prices: PriceData[]; dataString: string, currentPrice: number } | null>(null);
  const [analysis, setAnalysis] = React.useState<AnalyzeGoldenCrossOutput | null>(null);
  const [resistance, setResistance] = React.useState<PredictResistanceOutput | null>(null);
  const [support, setSupport] = React.useState<PredictSupportOutput | null>(null);
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
    setSupport(null);
    setRecommendation(null);
    setSearchQuery('');
  };

  const runAnalysis = React.useCallback((isRefresh = false) => {
    if (!selectedCoin) return;

    startTransition(async () => {
      try {
        // 1. Get historical data
        const data = await getHistoricalData(selectedCoin.id, timeframe);
        setHistoricalData(data);

        // 2. Perform initial analysis
        const analysisResult = await analyzeGoldenCross({
          coinName: selectedCoin.name,
          historicalData: data.dataString,
          timeframeDays: timeframe,
        });
        setAnalysis(analysisResult);

        // 3. If analysis is successful, predict support & resistance, then get recommendation
        if (analysisResult?.analysis) {
          const referencePrice = analysisResult.suggestedTradePrice || data.currentPrice;

          const [resistanceResult, supportResult] = await Promise.all([
            predictResistance({
              coinTicker: selectedCoin.ticker,
              referencePrice,
              analysisContext: analysisResult.analysis,
            }),
            predictSupport({
              coinTicker: selectedCoin.ticker,
              referencePrice,
              analysisContext: analysisResult.analysis,
            }),
          ]);
          
          setResistance(resistanceResult);
          setSupport(supportResult);

          if (resistanceResult && supportResult) {
            const recommendationResult = await tradeRecommendationSummary({
              initialAnalysis: analysisResult.analysis,
              resistancePrediction: resistanceResult.reasoning,
              supportPrediction: supportResult.reasoning,
              currentPrice: data.currentPrice,
            });
            setRecommendation(recommendationResult);
          }
        } else {
          setResistance(null);
          setSupport(null);
          setRecommendation(null);
        }

        if (isRefresh) {
            toast({
                title: 'Data Refreshed',
                description: `Successfully updated analysis for ${selectedCoin.name}.`
            });
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
  }, [selectedCoin, timeframe, toast, setSelectedCoin]);
  
  React.useEffect(() => {
    if (selectedCoin) {
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin, timeframe]);


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">Gold Predictor</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-3 !gap-0">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <h1 className="text-lg font-semibold">Gold Predictor</h1>
          </div>
        </header>
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {(isPending && !isSearching) && <DashboardSkeleton />}
          {!isPending && !selectedCoin && <WelcomeMessage />}
          {!isPending && selectedCoin && (
            <div className="space-y-6">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    {selectedCoin.name} Analysis
                  </h2>
                  {historicalData?.currentPrice && (
                    <span className="text-2xl font-bold text-primary">
                      ${historicalData.currentPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex w-full items-center gap-2 md:w-auto">
                    <span className="text-sm font-medium text-muted-foreground">Timeframe:</span>
                    <div className="flex flex-1 items-center gap-2 md:flex-none">
                      {timeframes.map((tf) => (
                          <Button
                              key={tf.value}
                              variant={timeframe === tf.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTimeframe(tf.value)}
                              disabled={isPending}
                              className="flex-1 md:flex-none"
                          >
                              {tf.label}
                          </Button>
                      ))}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => runAnalysis(true)}
                        disabled={isPending}
                        className="h-9 w-9"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        <span className="sr-only">Refresh</span>
                    </Button>
                </div>
              </div>

              {historicalData ? (
                <PriceChart 
                  priceData={historicalData.prices} 
                  resistanceLevels={resistance?.resistanceLevels}
                  supportLevels={support?.supportLevels}
                  suggestedTradePrice={analysis?.suggestedTradePrice}
                />
              ) : (isPending && <Skeleton className="aspect-video w-full" />)}
              <AnalysisResults
                analysis={analysis}
                resistance={resistance}
                support={support}
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
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary">
        <Bot className="size-8 text-secondary-foreground" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight">Welcome to Binance Gold Predictor</h3>
      <p className="mt-2 max-w-md text-muted-foreground">
        Select a cryptocurrency from the sidebar to begin your AI-powered technical analysis and discover potential trading opportunities.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
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
