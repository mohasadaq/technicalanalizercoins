'use server';
/**
 * @fileOverview Provides a comprehensive trade analysis including market patterns, support/resistance, and a full trade plan.
 *
 * - generateComprehensiveAnalysis - A function that generates a complete analysis.
 * - ComprehensiveAnalysisInput - The input type for the function.
 * - ComprehensiveAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ComprehensiveAnalysisInputSchema = z.object({
  historicalData: z.string().describe('Historical price data for the cryptocurrency.'),
  coinName: z.string().describe('Name of the cryptocurrency.'),
  coinTicker: z.string().describe('The ticker symbol of the cryptocurrency.'),
  timeframeDays: z.number().describe('The timeframe for the analysis in days.'),
  currentPrice: z.number().describe('The current price of the asset.'),
});
export type ComprehensiveAnalysisInput = z.infer<typeof ComprehensiveAnalysisInputSchema>;

const ComprehensiveAnalysisOutputSchema = z.object({
  analysis: z.object({
      goldenCrossDetected: z.boolean().describe('Whether a significant bullish signal is detected.'),
      summary: z.string().describe('Detailed analysis of the chart, including potential trading opportunities and risks.'),
      suggestedTradePrice: z.number().optional().describe('Suggested trade price based on the analysis.'),
      confidenceLevel: z.string().optional().describe('Confidence level of the signal (High, Medium, Low).'),
  }),
  resistance: z.object({
      resistanceLevels: z.array(z.number()).describe('An array of predicted resistance levels for the cryptocurrency, in ascending order.'),
      confidence: z.number().min(0).max(1).describe('A confidence score (0 to 1) for the resistance level predictions.'),
      reasoning: z.string().describe('Explanation of the reasoning behind the resistance level predictions.'),
  }),
  support: z.object({
      supportLevels: z.array(z.number()).describe('An array of predicted support levels for the cryptocurrency, in descending order.'),
      confidence: z.number().min(0).max(1).describe('A confidence score (0 to 1) for the support level predictions.'),
      reasoning: z.string().describe('Explanation of the reasoning behind the support level predictions.'),
  }),
  recommendation: z.object({
      strategy: z.string().describe("The name of the trading strategy (e.g., 'Bullish Breakout', 'Range Trading')."),
      entryPrice: z.number().optional().describe("The suggested entry price for the trade."),
      takeProfitLevels: z.array(z.object({
          price: z.number().describe("The take-profit price level."),
          percentageGain: z.number().describe("The percentage gain from the entry price at this level."),
          sellPercentage: z.number().describe("The percentage of the position to sell at this level (e.g., 50 for 50%)."),
      })).describe("An array of suggested take-profit levels, defining a scaling-out strategy."),
      stopLossLevel: z.number().optional().describe("The suggested stop-loss price level to manage risk."),
      dcaLevels: z.array(z.object({
          price: z.number().describe("The price for the DCA entry."),
          allocation: z.number().describe("The percentage of capital to allocate at this level (e.g., 50 for 50%)."),
      })).optional().describe("An array of suggested Dollar-Cost Averaging (DCA) levels to build a position."),
      summary: z.string().describe("A concise summary of the trade recommendation and reasoning."),
      confidence: z.string().describe("A confidence indicator for the recommendation (e.g., 'High', 'Medium', 'Low')."),
  })
});
export type ComprehensiveAnalysisOutput = z.infer<typeof ComprehensiveAnalysisOutputSchema>;

export async function generateComprehensiveAnalysis(
  input: ComprehensiveAnalysisInput
): Promise<ComprehensiveAnalysisOutput> {
  return comprehensiveAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'comprehensiveAnalysisPrompt',
  input: {schema: ComprehensiveAnalysisInputSchema},
  output: {schema: ComprehensiveAnalysisOutputSchema},
  prompt: `You are an expert cryptocurrency analyst and trading strategist for a day trader.
Your goal is to provide a complete, actionable trade plan based on the provided data. Perform a comprehensive analysis and return the entire output in a single JSON object.

**Analysis Context:**
- Coin: {{coinName}} ({{coinTicker}})
- Timeframe: {{timeframeDays}} days
- Current Price: {{{currentPrice}}}
- Historical Data: {{{historicalData}}}
The historical data contains price, a short-term moving average (ma_short), and a long-term moving average (ma_long).

**Instructions:**

1.  **Market Analysis**:
    - Analyze the historical data based on the given timeframe. For short timeframes (<= 30 days), focus on momentum, volatility, and short-term patterns. For longer timeframes (> 30 days), analyze for patterns like the Golden Cross.
    - Determine if a significant bullish signal is present. Set 'goldenCrossDetected' accordingly.
    - Provide a detailed 'summary' of your findings.
    - If appropriate, provide a 'suggestedTradePrice' and 'confidenceLevel' (High, Medium, Low).

2.  **Support & Resistance Prediction**:
    - Based on your market analysis, predict key support and resistance levels.
    - Provide reasoning for your predictions and a confidence score (0-1) for both support and resistance.

3.  **Trade Recommendation**:
    - Formulate a complete trading strategy.
    - **Strategy**: Give it a clear name (e.g., "Bullish Breakout," "Support Bounce").
    - **Entry Price**: Suggest a specific entry price.
    - **Take-Profit Levels**: Provide 1-3 take-profit targets. For each, specify the price, the percentage gain from entry, and the percentage of the position to sell (scaling-out). The total sell percentage should not exceed 100.
    - **Stop-Loss Level**: Define a logical stop-loss price to manage risk.
    - **DCA Levels**: If appropriate (e.g., buying a dip), suggest 1-2 Dollar-Cost Averaging levels with allocation percentages. If not suitable, return an empty array.
    - **Summary**: Write a concise summary of the overall trade plan.
    - **Confidence**: State your confidence (High, Medium, Low) in this trade setup.

Provide the entire analysis in a single, nested JSON object that matches the output schema.
`,
});

const comprehensiveAnalysisFlow = ai.defineFlow(
  {
    name: 'comprehensiveAnalysisFlow',
    inputSchema: ComprehensiveAnalysisInputSchema,
    outputSchema: ComprehensiveAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
