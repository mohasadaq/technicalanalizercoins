'use server';

/**
 * @fileOverview Resistance level prediction flow for crypto analysis.
 *
 * - predictResistance - Predicts resistance levels for a cryptocurrency.
 * - PredictResistanceInput - Input type for the predictResistance function.
 * - PredictResistanceOutput - Return type for the predictResistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictResistanceInputSchema = z.object({
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
export type PredictResistanceInput = z.infer<typeof PredictResistanceInputSchema>;

const PredictResistanceOutputSchema = z.object({
  resistanceLevels: z
    .array(z.number())
    .describe(
      'An array of predicted resistance levels for the cryptocurrency, in ascending order.'
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A confidence score (0 to 1) for the resistance level predictions, indicating the reliability of the prediction.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of the reasoning behind the resistance level predictions.'
    ),
});
export type PredictResistanceOutput = z.infer<typeof PredictResistanceOutputSchema>;

export async function predictResistance(input: PredictResistanceInput): Promise<PredictResistanceOutput> {
  return predictResistanceFlow(input);
}

const predictResistancePrompt = ai.definePrompt({
  name: 'predictResistancePrompt',
  input: {schema: PredictResistanceInputSchema},
  output: {schema: PredictResistanceOutputSchema},
  prompt: `You are an expert cryptocurrency technical analyst.
  Given the following information about a cryptocurrency, predict the resistance levels and the confidence in your prediction. The analysis might be for a golden cross or another chart pattern.

  Coin Ticker: {{{coinTicker}}}
  Reference Price: {{{referencePrice}}}
  Analysis Context: {{{analysisContext}}}

  Provide the resistance levels as an array of numbers and a confidence score between 0 and 1.  Also, explain the reasoning behind your predictions.
  `,
});

const predictResistanceFlow = ai.defineFlow(
  {
    name: 'predictResistanceFlow',
    inputSchema: PredictResistanceInputSchema,
    outputSchema: PredictResistanceOutputSchema,
  },
  async input => {
    const {output} = await predictResistancePrompt(input);
    return output!;
  }
);
