'use server';

/**
 * @fileOverview Analyzes historical price data to identify potential golden cross formations for cryptocurrencies.
 *
 * - analyzeGoldenCross - A function that analyzes the golden cross and returns analysis result.
 * - AnalyzeGoldenCrossInput - The input type for the analyzeGoldenCross function.
 * - AnalyzeGoldenCrossOutput - The return type for the analyzeGoldenCross function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeGoldenCrossInputSchema = z.object({
  historicalData: z.string().describe('Historical price data for the cryptocurrency.'),
  coinName: z.string().describe('Name of the cryptocurrency.'),
  timeframeDays: z.number().describe('The timeframe for the analysis in days.'),
});
export type AnalyzeGoldenCrossInput = z.infer<typeof AnalyzeGoldenCrossInputSchema>;

const AnalyzeGoldenCrossOutputSchema = z.object({
  goldenCrossDetected: z.boolean().describe('Whether a significant bullish signal is detected.'),
  analysis: z.string().describe('Detailed analysis of the chart, including potential trading opportunities and risks.'),
  suggestedTradePrice: z.number().optional().describe('Suggested trade price based on the analysis.'),
  confidenceLevel: z.string().optional().describe('Confidence level of the signal (High, Medium, Low).'),
});
export type AnalyzeGoldenCrossOutput = z.infer<typeof AnalyzeGoldenCrossOutputSchema>;

export async function analyzeGoldenCross(input: AnalyzeGoldenCrossInput): Promise<AnalyzeGoldenCrossOutput> {
  return analyzeGoldenCrossFlow(input);
}

const prompt = ai.definePrompt({
  name: 'goldenCrossAnalysisPrompt',
  input: {schema: AnalyzeGoldenCrossInputSchema},
  output: {schema: AnalyzeGoldenCrossOutputSchema},
  prompt: `You are an expert cryptocurrency analyst. Your analysis should be tailored to the provided timeframe.

Timeframe: {{timeframeDays}} days
Coin: {{coinName}}
Historical Data: {{{historicalData}}}

The historical data contains price, a short-term moving average (ma_short), and a long-term moving average (ma_long).

If the timeframe is short (30 days or less), focus on short-term indicators suitable for day trading. Analyze momentum, volatility, and short-term chart patterns (like flags, pennants, wedges). The moving averages are based on data periods (e.g., hours), not days. A "Golden Cross" is less relevant here.

If the timeframe is long (more than 30 days), you can analyze for longer-term patterns like the Golden Cross (a crossover of the short-term MA above the long-term MA).

Based on your analysis, determine if a significant bullish signal (like a golden cross on long timeframes, or a strong breakout on short timeframes) is present.
- If a bullish signal is detected, set goldenCrossDetected to true. Provide a detailed analysis of the formation, including potential trading opportunities and risks for a day trader.
- If no bullish signal is detected, set goldenCrossDetected to false. Provide a general analysis of the price chart and identify any other potential trading opportunities or notable patterns (e.g., support/resistance levels, death cross, chart patterns) relevant to the timeframe.

Your analysis should always be insightful and tailored to the timeframe.

Suggest a trade price and a confidence level for any identified signal if you are confident in your analysis. Otherwise, omit them.

Output in JSON format.
`,
});

const analyzeGoldenCrossFlow = ai.defineFlow(
  {
    name: 'analyzeGoldenCrossFlow',
    inputSchema: AnalyzeGoldenCrossInputSchema,
    outputSchema: AnalyzeGoldenCrossOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
