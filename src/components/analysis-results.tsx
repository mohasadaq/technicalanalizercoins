'use client';

import * as React from 'react';
import { AlertTriangle, Bell, Bot, CheckCircle2, Shield, TrendingUp, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type {
  AnalyzeGoldenCrossOutput,
  PredictResistanceOutput,
  TradeRecommendationSummaryOutput,
} from '@/app/actions';
import type { Coin } from '@/types';

interface AnalysisResultsProps {
  analysis: AnalyzeGoldenCrossOutput | null;
  resistance: PredictResistanceOutput | null;
  recommendation: TradeRecommendationSummaryOutput | null;
  coin: Coin;
}

export function AnalysisResults({ analysis, resistance, recommendation, coin }: AnalysisResultsProps) {
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
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {analysis.goldenCrossDetected ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-md bg-primary/10">
                <TrendingUp className="size-6 text-primary" />
              </div>
              <CardTitle>Golden Cross Analysis</CardTitle>
            </div>
            <CardDescription>{analysis.analysis}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Detected
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confidence</span>
              <Badge variant="outline" className={confidenceColor(analysis.confidenceLevel)}>
                {analysis.confidenceLevel || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Suggested Trade Price</span>
              <span className="font-semibold text-primary">
                {analysis.suggestedTradePrice ? `$${analysis.suggestedTradePrice.toLocaleString()}` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-md bg-primary/10">
                <TrendingUp className="size-6 text-primary" />
              </div>
              <CardTitle>Market Analysis</CardTitle>
            </div>
            <CardDescription>{analysis.analysis}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Golden Cross</span>
              <Badge variant="outline" className="text-muted-foreground border-dashed">
                <XCircle className="mr-2 h-4 w-4" /> Not Detected
              </Badge>
            </div>
            {analysis.suggestedTradePrice && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Suggested Entry Price</span>
                <span className="font-semibold text-primary">
                  {`$${analysis.suggestedTradePrice.toLocaleString()}`}
                </span>
              </div>
            )}
            {analysis.confidenceLevel && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confidence</span>
                <Badge variant="outline" className={confidenceColor(analysis.confidenceLevel)}>
                  {analysis.confidenceLevel}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
            <CardTitle>Resistance Prediction</CardTitle>
          </div>
          <CardDescription>{resistance?.reasoning || 'Awaiting resistance analysis...'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Confidence</span>
            <Badge variant="outline" className={resistance ? confidenceColor(resistance.confidence > 0.7 ? 'High' : resistance.confidence > 0.4 ? 'Medium' : 'Low') : ''}>
              {resistance ? `${(resistance.confidence * 100).toFixed(0)}%` : 'N/A'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Predicted Levels</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {resistance?.resistanceLevels?.map((level, i) => (
                <Badge key={i} variant="secondary" className="text-base">
                  ${level.toLocaleString()}
                </Badge>
              )) || <span className="text-sm text-muted-foreground">No levels predicted.</span>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-primary/10 to-card">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-accent/20">
              <Bot className="size-6 text-accent" />
            </div>
            <CardTitle>AI Trade Recommendation</CardTitle>
          </div>
          <CardDescription>{recommendation?.recommendation || 'Awaiting final recommendation...'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Confidence</span>
            <Badge variant="outline" className={confidenceColor(recommendation?.confidence)}>
              {recommendation?.confidence || 'N/A'}
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSetAlert} disabled={!recommendation}>
            <Bell className="mr-2 h-4 w-4" /> Set Price Alert
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
