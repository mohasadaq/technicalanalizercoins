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
  analysis: z.string().describe('Detailed analysis of the golden cross formation, including potential trading opportunities and risks.'),
  suggestedTradePrice: z.number().optional().describe('Suggested trade price based on the golden cross analysis.'),
  confidenceLevel: z.string().optional().describe('Confidence level of the golden cross signal (High, Medium, Low).'),
});
export type AnalyzeGoldenCrossOutput = z.infer<typeof AnalyzeGoldenCrossOutputSchema>;

export async function analyzeGoldenCross(input: AnalyzeGoldenCrossInput): Promise<AnalyzeGoldenCrossOutput> {
  return analyzeGoldenCrossFlow(input);
}

const prompt = ai.definePrompt({
  name: 'goldenCrossAnalysisPrompt',
  input: {schema: AnalyzeGoldenCrossInputSchema},
  output: {schema: AnalyzeGoldenCrossOutputSchema},
  prompt: `You are an expert cryptocurrency analyst. Analyze the following historical price data for {{coinName}} to identify potential golden cross formations and trading opportunities.

Historical Data: {{{historicalData}}}

Based on your analysis, determine if a golden cross formation is present. Provide a detailed analysis of the formation, including potential trading opportunities and risks. Suggest a trade price and a confidence level for the signal.

Consider providing a suggestedTradePrice and confidenceLevel, but these are only suggestions, and should be ommitted if you are not confident in your analysis.

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
