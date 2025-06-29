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
});
export type AnalyzeGoldenCrossInput = z.infer<typeof AnalyzeGoldenCrossInputSchema>;

const AnalyzeGoldenCrossOutputSchema = z.object({
  goldenCrossDetected: z.boolean().describe('Whether a golden cross formation is detected.'),
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
  prompt: `You are an expert cryptocurrency analyst. Analyze the following historical price data for {{coinName}} to identify potential golden cross formations and other trading opportunities.

Historical Data: {{{historicalData}}}

Based on your analysis, determine if a golden cross formation is present.
- If a golden cross is detected, set goldenCrossDetected to true. Provide a detailed analysis of the formation, including potential trading opportunities and risks.
- If no golden cross is detected, set goldenCrossDetected to false. Provide a general analysis of the price chart and identify any other potential trading opportunities or notable patterns (e.g., support/resistance levels, death cross, chart patterns).

Your analysis should always be insightful, whether a golden cross is found or not.

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
