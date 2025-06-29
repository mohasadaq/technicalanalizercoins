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
  supportPrediction: z.string().describe('The predicted support levels.'),
  currentPrice: z.number().describe('The current price of the asset.'),
});
export type TradeRecommendationSummaryInput = z.infer<
  typeof TradeRecommendationSummaryInputSchema
>;

const TradeRecommendationSummaryOutputSchema = z.object({
  strategy: z.string().describe("The name of the trading strategy (e.g., 'Bullish Breakout', 'Range Trading')."),
  entryPrice: z.number().optional().describe("The suggested entry price for the trade."),
  takeProfitLevels: z.array(z.object({
      price: z.number().describe("The take-profit price level."),
      percentageGain: z.number().describe("The percentage gain from the entry price at this level."),
      sellPercentage: z.number().describe("The percentage of the position to sell at this level (e.g., 50 for 50%)."),
  })).describe("An array of suggested take-profit levels, defining a scaling-out strategy. Each level specifies the price, the percentage gain from entry, and what percentage of the position to sell."),
  stopLossLevel: z.number().optional().describe("The suggested stop-loss price level to manage risk."),
  dcaLevels: z.array(z.object({
      price: z.number().describe("The price for the DCA entry."),
      allocation: z.number().describe("The percentage of capital to allocate at this level (e.g., 50 for 50%)."),
  })).optional().describe("An array of suggested Dollar-Cost Averaging (DCA) levels to build a position, if applicable."),
  summary: z.string().describe("A concise summary of the trade recommendation and reasoning."),
  confidence: z.string().describe("A confidence indicator for the recommendation (e.g., 'High', 'Medium', 'Low')."),
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
  prompt: `You are an expert trading strategist for a day trader. Your goal is to provide a clear, actionable trade plan based on the provided analysis.

Analyze the initial analysis, support levels, and resistance levels to formulate a trading strategy. Your recommendation should be specific and include:
1.  **Strategy**: A clear name for the trading setup (e.g., "Bullish Breakout Above Resistance", "Support Bounce", "Range Trading").
2.  **Entry Price**: A specific price point to enter the trade. This should be based on the analysis, like a breakout above a resistance or a bounce from a support level.
3.  **Take-Profit Levels**: Identify 1-3 realistic price targets where the trader could take profits. These should correspond to resistance levels or other technical targets. For each level, provide the price, the percentage gain from the entry price, and **the percentage of the position to sell at this level (e.g., sell 50% at TP1, 30% at TP2).** This defines a scaling-out strategy. The sum of sellPercentage across all levels should not exceed 100.
4.  **Stop-Loss Level**: A specific price to exit the trade if it moves against the plan. This should be placed logically below a key support level or key technical area to limit potential losses.
5.  **DCA Levels**: If appropriate for the strategy (e.g., buying a dip, not chasing a sharp breakout), suggest 1-2 Dollar-Cost Averaging (DCA) levels below the initial entry. Base these on key support levels. For each DCA level, specify the price and the percentage of capital to allocate (e.g., 30 for 30%). If a DCA strategy is not suitable, return an empty array for dcaLevels.
6.  **Summary**: A concise explanation of the reasoning behind the recommendation.
7.  **Confidence**: Your confidence in this trade setup (High, Medium, or Low).

Initial Analysis: {{{initialAnalysis}}}
Resistance Prediction: {{{resistancePrediction}}}
Support Prediction: {{{supportPrediction}}}
Current Price: {{{currentPrice}}}

Provide a complete and actionable trade plan in JSON format.`,
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
