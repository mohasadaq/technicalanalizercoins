
'use client';

import * as React from 'react';
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
import { Bot, CandlestickChart, ChevronsUpDown, Github, RefreshCw, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const [popoverOpen, setPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    // When search query is empty, show initial coins. If not empty, search.
    if (searchQuery.trim() === '') {
      setDisplayedCoins(initialCoins);
      return;
    }
    
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        startSearchTransition(async () => {
          const results = await searchCoins(searchQuery);
          setDisplayedCoins(results);
        });
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, initialCoins]);

  const handleCoinSelect = (coin: Coin) => {
    if (selectedCoin?.id === coin.id) {
        setPopoverOpen(false);
        return;
    };

    setSelectedCoin(coin);
    setHistoricalData(null);
    setAnalysis(null);
    setResistance(null);
    setSupport(null);
    setRecommendation(null);
    setSearchQuery('');
    setPopoverOpen(false);
  };

  const runAnalysis = React.useCallback((isRefresh = false) => {
    if (!selectedCoin) return;

    startTransition(async () => {
      try {
        if (!isRefresh) {
            setHistoricalData(null);
            setAnalysis(null);
            setResistance(null);
            setSupport(null);
            setRecommendation(null);
        }
        
        const data = await getHistoricalData(selectedCoin.id, timeframe);
        setHistoricalData(data);

        const analysisResult = await analyzeGoldenCross({
          coinName: selectedCoin.name,
          historicalData: data.dataString,
          timeframeDays: timeframe,
        });
        setAnalysis(analysisResult);

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
  }, [selectedCoin, timeframe, toast]);
  
  React.useEffect(() => {
    if (selectedCoin) {
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin, timeframe]);

  return (
    <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-2 mr-auto">
                <Logo className="size-8 text-primary" />
                <h1 className="text-xl font-semibold hidden sm:block">Gold Predictor</h1>
            </div>
            
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-[200px] sm:w-[300px] justify-between"
                    >
                        {selectedCoin
                        ? <span className="truncate">{`${selectedCoin.name} (${selectedCoin.ticker})`}</span>
                        : "Select a coin..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <div className="p-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search coins..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ScrollArea className="h-[300px]">
                        <div className="flex flex-col gap-1 p-2 pt-0">
                            {isSearching ? (
                                <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
                            ) : displayedCoins.length > 0 ? (
                                displayedCoins.map((coin) => (
                                    <Button
                                        key={coin.id}
                                        variant="ghost"
                                        className="w-full justify-start gap-2"
                                        onClick={() => handleCoinSelect(coin)}
                                        disabled={isPending}
                                    >
                                        <CandlestickChart className="h-4 w-4" />
                                        <span>{coin.name} ({coin.ticker})</span>
                                    </Button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No results found.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:flex">
                    <a href="https://github.com/firebase/studio-examples" target="_blank">
                        <Github />
                        <span>Source Code</span>
                    </a>
                </Button>
                <Button variant="ghost" size="icon" asChild className="flex sm:hidden">
                    <a href="https://github.com/firebase/studio-examples" target="_blank">
                        <Github />
                        <span className="sr-only">Source Code</span>
                    </a>
                </Button>
            </div>
        </header>
      <main className="flex-1 space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
        {(isPending && !isSearching) && <DashboardSkeleton />}
        {!isPending && !selectedCoin && <WelcomeMessage />}
        {!isPending && selectedCoin && (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                      {selectedCoin.name} <span className="text-muted-foreground">{selectedCoin.ticker}</span>
                  </h2>
                  {historicalData?.currentPrice && (
                      <p className="text-2xl font-bold text-primary">
                      ${historicalData.currentPrice.toLocaleString()}
                      </p>
                  )}
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto">
                  <div className="flex flex-1 items-center gap-1 rounded-md bg-secondary p-1 md:flex-none">
                    {timeframes.map((tf) => (
                        <Button
                            key={tf.value}
                            variant={timeframe === tf.value ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeframe(tf.value)}
                            disabled={isPending}
                            className="flex-1 md:flex-none shadow-sm"
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
            ) : (isPending && <Skeleton className="aspect-video w-full rounded-lg" />)}
            
            <AnalysisResults
                analysis={analysis}
                resistance={resistance}
                support={support}
                recommendation={recommendation}
                coin={selectedCoin}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-8 text-center mt-8">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-secondary">
        <Bot className="size-10 text-secondary-foreground" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight">Welcome to Gold Predictor</h3>
      <p className="mt-2 max-w-md text-muted-foreground">
        Select a cryptocurrency from the dropdown above to begin your AI-powered technical analysis.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg lg:col-span-4" />
      </div>
    </div>
  );
}
