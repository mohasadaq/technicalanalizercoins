'use server';

import {
  generateComprehensiveAnalysis as generateComprehensiveAnalysisFlow,
  type ComprehensiveAnalysisInput,
  type ComprehensiveAnalysisOutput as ComprehensiveAnalysisOutputType,
} from '@/ai/flows/comprehensive-analysis';
import { searchCoins as searchCoinsData } from '@/lib/data';
import type { Coin } from '@/types';

export type ComprehensiveAnalysisOutput = ComprehensiveAnalysisOutputType;

export async function generateComprehensiveAnalysis(
  input: ComprehensiveAnalysisInput
): Promise<ComprehensiveAnalysisOutput> {
  return await generateComprehensiveAnalysisFlow(input);
}

export async function searchCoins(query: string): Promise<Coin[]> {
  return await searchCoinsData(query);
}
