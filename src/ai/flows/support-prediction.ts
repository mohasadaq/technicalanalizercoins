'use server';

/**
 * @fileOverview Support level prediction flow for crypto analysis.
 *
 * - predictSupport - Predicts support levels for a cryptocurrency.
 * - PredictSupportInput - Input type for the predictSupport function.
 * - PredictSupportOutput - Return type for the predictSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictSupportInputSchema = z.object({
  coinTicker: z.string().describe('The ticker symbol of the cryptocurrency.'),
  referencePrice: z
    .number()
    .describe('The reference price for the analysis, such as current price or suggested entry price.'),
  analysisContext: z
    .string()
    .describe(
      'Contextual analysis of the coin, including recent news, market trends, and trading volume.'
    ),
});
export type PredictSupportInput = z.infer<typeof PredictSupportInputSchema>;

const PredictSupportOutputSchema = z.object({
  supportLevels: z
    .array(z.number())
    .describe(
      'An array of predicted support levels for the cryptocurrency, in descending order.'
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A confidence score (0 to 1) for the support level predictions, indicating the reliability of the prediction.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of the reasoning behind the support level predictions.'
    ),
});
export type PredictSupportOutput = z.infer<typeof PredictSupportOutputSchema>;

export async function predictSupport(input: PredictSupportInput): Promise<PredictSupportOutput> {
  return predictSupportFlow(input);
}

const predictSupportPrompt = ai.definePrompt({
  name: 'predictSupportPrompt',
  input: {schema: PredictSupportInputSchema},
  output: {schema: PredictSupportOutputSchema},
  prompt: `You are an expert cryptocurrency technical analyst.
  Given the following information about a cryptocurrency, predict the key support levels below the reference price and the confidence in your prediction.

  Coin Ticker: {{{coinTicker}}}
  Reference Price: {{{referencePrice}}}
  Analysis Context: {{{analysisContext}}}

  Provide the support levels as an array of numbers and a confidence score between 0 and 1. Also, explain the reasoning behind your predictions, considering factors like historical price action, moving averages, and volume.
  `,
});

const predictSupportFlow = ai.defineFlow(
  {
    name: 'predictSupportFlow',
    inputSchema: PredictSupportInputSchema,
    outputSchema: PredictSupportOutputSchema,
  },
  async input => {
    const {output} = await predictSupportPrompt(input);
    return output!;
  }
);
