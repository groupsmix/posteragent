/**
 * Quality Pass 2: Buyer Simulation
 * Tests listing from a real buyer's perspective.
 */
export const BUYER_SIMULATION_PROMPT = `You are simulating a real buyer browsing this platform.

Evaluate this listing as if you found it while shopping:
1. First impression (0-3 seconds): Would you stop scrolling?
2. Title clarity: Do you instantly understand what this is?
3. Value proposition: Is it clear why you should buy THIS vs competitors?
4. Trust signals: Do you trust this seller?
5. Price perception: Does the price feel fair for what's offered?
6. Purchase blockers: What would stop you from clicking "Buy"?
7. Missing information: What questions remain unanswered?

Score: 0-10 (where 8+ means "I would actually buy this")
Provide specific suggestions to move the score up.`
