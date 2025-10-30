import { describe, it, expect } from "vitest"
import {
  calculateStakingIncome,
  calculateGenerationCommission,
  calculateReferralIncome,
} from "@/lib/mlmLogic"

describe("MLM Logic - Staking Income", () => {
  it("returns 0 when stake is below $100", () => {
    expect(calculateStakingIncome(99)).toBe(0)
  })

  it("applies 4% tier for $100 - $1,000", () => {
    expect(calculateStakingIncome(100)).toBe(4)
    expect(calculateStakingIncome(1000)).toBe(40)
  })

  it("applies 5% tier for $1,000 - $4,000", () => {
    expect(calculateStakingIncome(1500)).toBe(75)
    expect(calculateStakingIncome(4000)).toBe(200)
  })

  it("applies 6% tier for $4,000 - $6,000", () => {
    expect(calculateStakingIncome(5000)).toBe(300)
  })

  it("applies 7% tier for $6,000 - $10,000", () => {
    expect(calculateStakingIncome(8000)).toBe(560)
    expect(calculateStakingIncome(10000)).toBe(700)
  })

  it("applies 8% tier for > $10,000", () => {
    expect(calculateStakingIncome(20000)).toBe(1600)
  })
})

describe("MLM Logic - Generation Commission", () => {
  it("returns fixed values for levels 1-5", () => {
    expect(calculateGenerationCommission(1)).toBe(300)
    expect(calculateGenerationCommission(2)).toBe(100)
    expect(calculateGenerationCommission(3)).toBe(80)
    expect(calculateGenerationCommission(4)).toBe(70)
    expect(calculateGenerationCommission(5)).toBe(60)
  })

  it("returns 0 for other levels", () => {
    expect(calculateGenerationCommission(0)).toBe(0)
    expect(calculateGenerationCommission(6)).toBe(0)
  })
})

describe("MLM Logic - Referral Income", () => {
  it("calculates level-based percentages on referral profit", () => {
    expect(calculateReferralIncome(1, 500)).toBe(100)
    expect(calculateReferralIncome(2, 500)).toBe(50)
    expect(calculateReferralIncome(3, 500)).toBe(25)
  })

  it("returns 0 for unsupported levels", () => {
    expect(calculateReferralIncome(4, 500)).toBe(0)
  })
})


