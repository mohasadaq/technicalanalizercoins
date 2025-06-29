'use client';

import * as React from 'react';
import { ArrowDownToLine, Bell, Bot, CheckCircle2, Shield, TrendingUp, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type {
  AnalyzeGoldenCrossOutput,
  PredictResistanceOutput,
  PredictSupportOutput,
  TradeRecommendationSummaryOutput,
} from '@/app/actions';
import type { Coin } from '@/types';
import { cn } from '@/lib/utils';

interface AnalysisResultsProps {
  analysis: AnalyzeGoldenCrossOutput | null;
  resistance: PredictResistanceOutput | null;
  support: PredictSupportOutput | null;
  recommendation: TradeRecommendationSummaryOutput | null;
  coin: Coin;
}

export function AnalysisResults({ analysis, resistance, support, recommendation, coin }: AnalysisResultsProps) {
  const { toast } = useToast();

  const handleSetAlert = () => {
    toast({
      title: 'Price Alert Set',
      description: `We'll notify you about ${coin.ticker} based on the latest analysis.`,
      action: (
        <Button variant="secondary" size="sm">
          Manage Alerts
        </Button>
      ),
    });
  };

  if (!analysis) {
    return null;
  }

  const confidenceColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-accent/10 text-accent border-accent/20';
      case 'medium': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'low': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const AnalysisCard = ({ analysis }: { analysis: AnalyzeGoldenCrossOutput }) => (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            <TrendingUp className="size-6 text-primary" />
          </div>
          <CardTitle>Market Analysis</CardTitle>
        </div>
        <CardDescription>{analysis.analysis}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Bullish Signal</span>
          <Badge variant="outline" className={cn(analysis.goldenCrossDetected ? 'text-accent border-accent/50 bg-accent/10' : 'text-muted-foreground border-dashed')}>
            {analysis.goldenCrossDetected ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
            {analysis.goldenCrossDetected ? 'Detected' : 'Not Detected'}
          </Badge>
        </div>
        {analysis.suggestedTradePrice && (
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Suggested Entry</span>
                <span className="font-semibold text-primary">
                {`$${analysis.suggestedTradePrice.toLocaleString()}`}
                </span>
            </div>
        )}
      </CardContent>
      {analysis.confidenceLevel && (
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Signal Confidence</span>
            <Badge variant="outline" className={confidenceColor(analysis.confidenceLevel)}>
              {analysis.confidenceLevel}
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );

  const ResistanceCard = ({ resistance }: { resistance: PredictResistanceOutput | null }) => (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-destructive/10">
            <Shield className="size-6 text-destructive" />
          </div>
          <CardTitle>Resistance</CardTitle>
        </div>
        <CardDescription>{resistance?.reasoning || 'Awaiting analysis...'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <span className="text-muted-foreground">Predicted Levels</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {resistance?.resistanceLevels?.map((level, i) => (
            <Badge key={i} variant="secondary" className="justify-center py-1 text-base tabular-nums">
              ${level.toLocaleString()}
            </Badge>
          )) || <span className="text-sm text-muted-foreground col-span-2">No levels predicted.</span>}
        </div>
      </CardContent>
      {resistance && (
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Confidence</span>
            <Badge variant="outline" className={confidenceColor(resistance.confidence > 0.7 ? 'High' : resistance.confidence > 0.4 ? 'Medium' : 'Low')}>
              {`${(resistance.confidence * 100).toFixed(0)}%`}
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );

  const SupportCard = ({ support }: { support: PredictSupportOutput | null }) => (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-chart-2/10">
            <ArrowDownToLine className="size-6 text-chart-2" />
          </div>
          <CardTitle>Support</CardTitle>
        </div>
        <CardDescription>{support?.reasoning || 'Awaiting analysis...'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <span className="text-muted-foreground">Predicted Levels</span>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {support?.supportLevels?.map((level, i) => (
            <Badge key={i} variant="secondary" className="justify-center py-1 text-base tabular-nums">
              ${level.toLocaleString()}
            </Badge>
          )) || <span className="text-sm text-muted-foreground col-span-2">No levels predicted.</span>}
        </div>
      </CardContent>
      {support && (
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Confidence</span>
            <Badge variant="outline" className={confidenceColor(support.confidence > 0.7 ? 'High' : support.confidence > 0.4 ? 'Medium' : 'Low')}>
              {`${(support.confidence * 100).toFixed(0)}%`}
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );

  const RecommendationCard = ({ recommendation }: { recommendation: TradeRecommendationSummaryOutput | null }) => (
    <Card className="bg-gradient-to-br from-card to-secondary/30 lg:col-span-4 flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            <Bot className="size-6 text-primary" />
          </div>
          <CardTitle>AI Trade Recommendation</CardTitle>
        </div>
        {recommendation ? (
            <CardDescription className="text-base">{recommendation.summary}</CardDescription>
        ) : (
            <CardDescription className="text-base">Awaiting final recommendation...</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {recommendation ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Strategy</p>
                    <Badge variant="secondary" className="text-base py-1 px-3">{recommendation.strategy}</Badge>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Entry Price</p>
                    <p className="text-lg font-bold text-primary">{recommendation.entryPrice ? `$${recommendation.entryPrice.toLocaleString()}`: 'N/A'}</p>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Take Profit</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendation.takeProfitLevels.map((tp, i) => (
                            <Badge key={i} variant="outline" className="text-accent border-accent/50 bg-accent/10 text-sm py-1">
                                ${tp.price.toLocaleString()}
                                <span className="font-normal ml-1.5 opacity-80">(+{tp.percentage.toFixed(1)}%)</span>
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Stop Loss</p>
                    <p className="text-lg font-bold text-destructive">{recommendation.stopLossLevel ? `$${recommendation.stopLossLevel.toLocaleString()}` : 'N/A'}</p>
                </div>
            </div>
            {recommendation.dcaLevels && recommendation.dcaLevels.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-dashed">
                    <p className="text-sm font-medium text-muted-foreground">Dollar-Cost Averaging Plan</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendation.dcaLevels.map((dca, i) => (
                            <Badge key={i} variant="outline" className="border-primary/50 bg-primary/10 text-primary text-sm py-1 font-semibold">
                                Buy {dca.allocation}% at ~${dca.price.toLocaleString()}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="md:col-span-2 lg:col-span-4 text-center text-muted-foreground py-8">
            Generating detailed trade plan...
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4 md:flex-row md:justify-between md:items-center">
         {recommendation && (
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Confidence</span>
                <Badge variant="outline" className={confidenceColor(recommendation?.confidence)}>
                    {recommendation?.confidence || 'N/A'}
                </Badge>
            </div>
         )}
        <Button size="lg" className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSetAlert} disabled={!recommendation}>
          <Bell className="mr-2 h-5 w-5" /> Set Price Alert
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><AnalysisCard analysis={analysis} /></div>
        <ResistanceCard resistance={resistance} />
        <SupportCard support={support} />
        <RecommendationCard recommendation={recommendation} />
    </div>
  );
}
