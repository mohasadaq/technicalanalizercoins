'use server';

import { 
  analyzeGoldenCross as analyzeGoldenCrossFlow, 
  type AnalyzeGoldenCrossInput, 
  type AnalyzeGoldenCrossOutput as AnalyzeGoldenCrossOutputType 
} from '@/ai/flows/golden-cross-analysis';
import { 
  predictResistance as predictResistanceFlow, 
  type PredictResistanceInput, 
  type PredictResistanceOutput as PredictResistanceOutputType 
} from '@/ai/flows/resistance-prediction';
import { 
  tradeRecommendationSummary as tradeRecommendationSummaryFlow, 
  type TradeRecommendationSummaryInput, 
  type TradeRecommendationSummaryOutput as TradeRecommendationSummaryOutputType 
} from '@/ai/flows/trade-recommendation-summary';
import { searchCoins as searchCoinsData } from '@/lib/data';
import type { Coin } from '@/types';

export type AnalyzeGoldenCrossOutput = AnalyzeGoldenCrossOutputType;
export type PredictResistanceOutput = PredictResistanceOutputType;
export type TradeRecommendationSummaryOutput = TradeRecommendationSummaryOutputType;


export async function analyzeGoldenCross(input: AnalyzeGoldenCrossInput): Promise<AnalyzeGoldenCrossOutput> {
  return await analyzeGoldenCrossFlow(input);
}

export async function predictResistance(input: PredictResistanceInput): Promise<PredictResistanceOutput> {
  return await predictResistanceFlow(input);
}

export async function tradeRecommendationSummary(input: TradeRecommendationSummaryInput): Promise<TradeRecommendationSummaryOutput> {
  return await tradeRecommendationSummaryFlow(input);
}

export async function searchCoins(query: string): Promise<Coin[]> {
    return await searchCoinsData(query);
}
