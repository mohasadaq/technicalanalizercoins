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
      actionSignal: z.enum(['BUY', 'WAIT']).describe("A clear signal on whether to act now or wait. 'BUY' if the current price is opportune for entry; 'WAIT' if confirmation or a better price is needed."),
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
  prompt: `You are a professional quantitative analyst and trading strategist, specializing in short-term cryptocurrency markets for experienced day traders. Your analysis must be rigorous, data-driven, and highly professional. Your goal is to provide a complete, actionable trade plan based on the provided data.

**Primary Directive:** Generate a comprehensive analysis and return the entire output in a single, nested JSON object that precisely matches the output schema.

**Analysis Context:**
- Coin: {{coinName}} ({{coinTicker}})
- Timeframe: {{timeframeDays}} days
- Current Price: {{{currentPrice}}}
- Historical Data: \`{{{historicalData}}}\`
  - The historical data includes \`price\`, short-term moving average (\`ma_short\`), long-term moving average (\`ma_long\`), 24-hour trading \`volume\`, and the 14-period Relative Strength Index (\`rsi\`).

---

**Detailed Instructions:**

**1. Professional Market Analysis:**
   - **Timeframe-Specific Analysis:** Your analysis MUST be tailored to the given timeframe.
     - For **short timeframes (<= 7 days)**, focus on intraday momentum, volatility, volume patterns, and candlestick formations. The moving averages provided are based on hourly or shorter periods. A "Golden Cross" on this scale is a short-term momentum signal, not a major trend change.
     - For **longer timeframes (> 7 days)**, analyze for major trend indicators like the Golden Cross/Death Cross, key swing highs/lows, and overall market structure.
   - **Volume and RSI Analysis:**
     - **Volume:** Analyze the \`volume\` data. High volume accompanying a price move indicates strength and conviction. Low volume during a breakout or breakdown suggests a lack of follow-through. Look for volume spikes at key price levels.
     - **RSI:** Analyze the \`rsi\` data. Values above 70 may suggest overbought conditions, while values below 30 may suggest oversold conditions. Crucially, look for bullish (price makes a lower low, RSI makes a higher low) or bearish (price makes a higher high, RSI makes a lower high) divergences, as these can be powerful reversal signals.
   - **Bullish Signal Detection:** Scrutinize the data for a statistically significant bullish signal, considering price action, MAs, volume, and RSI. This could be a crossover on longer timeframes or a strong breakout with volume confirmation on shorter ones. Set \`goldenCrossDetected\` accordingly.
   - **Summary:** Write a professional, detailed \`summary\`. Synthesize your findings from price, MAs, volume, and RSI. Clearly articulate the current market sentiment, key observations, and potential risks or opportunities. Avoid hype and use precise terminology.
   - **Suggested Entry:** If a high-probability setup is identified, provide a \`suggestedTradePrice\`. If not, omit this field.
   - **Signal Confidence:** Assign a \`confidenceLevel\` (High, Medium, Low) based on the confluence of all indicators. Justify this confidence level implicitly in your summary.

**2. Data-Driven Support & Resistance:**
   - **Identify Key Levels:** Predict crucial support and resistance levels directly from the historical price action. Look for price clusters, pivot points, and swing highs/lows.
   - **Justify Predictions:** For both \`support\` and \`resistance\`, provide clear \`reasoning\`. Reference specific price action and other indicators (e.g., "Resistance at $X, which aligns with a high-volume rejection point and overbought RSI.").
   - **Confidence Score:** Assign a \`confidence\` score (0-1) for your S/R predictions based on how many times a level has been tested and respected, especially with significant volume.

**3. Actionable Trade Recommendation:**
   - **Strategy Formulation:** Devise a complete trading strategy and give it a professional name (e.g., "Bullish Continuation Play," "RSI Divergence Entry," "Key Support Bounce").
   - **Immediate Action Signal:** Based on the \`currentPrice\` relative to your recommended \`entryPrice\`, determine the immediate action. Set \`actionSignal\` to "BUY" if the current price is at a suitable entry point. Set it to "WAIT" if the price is far from the entry or if a confirmation signal (e.g., a breakout above resistance) is still required. This field is mandatory.
   - **Entry Price:** Define a precise \`entryPrice\`. This should be a logical level, not just the current price (e.g., "entry on a confirmed break above $X").
   - **Take-Profit (Scaling-Out) Plan:**
     - Provide 1-3 distinct \`takeProfitLevels\`. These levels **MUST** be higher than the \`entryPrice\`.
     - Base these targets on the resistance levels you identified or other technical price targets.
     - For each level, specify the target \`price\`, the \`percentageGain\` from entry, and the \`sellPercentage\` (the portion of the total position to sell). The total \`sellPercentage\` should not exceed 100.
   - **Risk Management (Stop-Loss):**
     - Define a logical \`stopLossLevel\`. This **MUST** be placed at a price *below* the \`entryPrice\` and at a technically significant point (e.g., just below a key support level or a recent swing low) to invalidate the trade idea if hit.
   - **Dollar-Cost Averaging (DCA):**
     - Suggest \`dcaLevels\` ONLY if the strategy is "buying a dip" into a strong support zone. For breakout strategies, this is generally inappropriate.
     - If you suggest DCA, provide 1-2 levels with price and capital \`allocation\`. Otherwise, return an empty array.
   - **Trade Summary:** Write a concise \`summary\` of the trade plan, reiterating the core thesis based on all available data.
   - **Overall Confidence:** State your \`confidence\` (High, Medium, Low) in this specific trade setup, considering the risk/reward ratio and the confluence of signals.
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
