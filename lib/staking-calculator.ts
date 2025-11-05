/**
 * Client-safe staking income calculator
 * This file has no MongoDB dependencies and can be used in client components
 */

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateStakingIncome(amount: number): number {
  if (amount < 100) return 0
  const tiers: Array<{ min: number; max: number | null; rate: number }> = [
    { min: 100, max: 1000, rate: 0.04 },
    { min: 1000, max: 4000, rate: 0.05 },
    { min: 4000, max: 6000, rate: 0.06 },
    { min: 6000, max: 10000, rate: 0.07 },
    { min: 10000, max: null, rate: 0.08 },
  ]

  // Check tiers from highest to lowest to ensure correct tier matching
  // $1,001 will match 5% tier ($1,000-$4,000)
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i]
    if (amount >= tier.min && (tier.max === null || amount <= tier.max)) {
      return roundToTwo(amount * tier.rate)
    }
  }
  return 0
}

