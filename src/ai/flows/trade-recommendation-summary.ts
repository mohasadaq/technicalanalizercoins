'use server';
/**
 * @fileOverview Provides a summary of trade recommendations (buy/sell prices) based on technical analysis and resistance prediction.
 *
 * - tradeRecommendationSummary - A function that generates a trade recommendation summary.
 * - TradeRecommendationSummaryInput - The input type for the tradeRecommendationSummary function.
 * - TradeRecommendationSummaryOutput - The return type for the tradeRecommendationSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TradeRecommendationSummaryInputSchema = z.object({
  initialAnalysis: z.string().describe('The initial technical analysis of the asset.'),
  resistancePrediction: z.string().describe('The predicted resistance levels.'),
  currentPrice: z.number().describe('The current price of the asset.'),
});
export type TradeRecommendationSummaryInput = z.infer<
  typeof TradeRecommendationSummaryInputSchema
>;

const TradeRecommendationSummaryOutputSchema = z.object({
  recommendation: z.string().describe('A concise trade recommendation (buy/sell prices).'),
  confidence: z
    .string()
    .describe('A confidence indicator for the recommendation (e.g., high, medium, low).'),
});
export type TradeRecommendationSummaryOutput = z.infer<
  typeof TradeRecommendationSummaryOutputSchema
>;

export async function tradeRecommendationSummary(
  input: TradeRecommendationSummaryInput
): Promise<TradeRecommendationSummaryOutput> {
  return tradeRecommendationSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tradeRecommendationSummaryPrompt',
  input: {schema: TradeRecommendationSummaryInputSchema},
  output: {schema: TradeRecommendationSummaryOutputSchema},
  prompt: `Based on the following initial technical analysis and resistance prediction, provide a concise trade recommendation (buy/sell prices) and a confidence indicator.

Initial Analysis: {{{initialAnalysis}}}
Resistance Prediction: {{{resistancePrediction}}}
Current Price: {{{currentPrice}}}

Trade Recommendation:`,
});

const tradeRecommendationSummaryFlow = ai.defineFlow(
  {
    name: 'tradeRecommendationSummaryFlow',
    inputSchema: TradeRecommendationSummaryInputSchema,
    outputSchema: TradeRecommendationSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
