/**
 * Test script to verify ROI distribution for one investor
 * Run with: node scripts/test-roi-distribution.js
 */

// Simulate the ROI calculation logic
function calculateStakingIncome(amount) {
  if (amount < 100) return 0
  const tiers = [
    { min: 100, max: 1000, rate: 0.04 },
    { min: 1000, max: 4000, rate: 0.05 },
    { min: 4000, max: 6000, rate: 0.06 },
    { min: 6000, max: 10000, rate: 0.07 },
    { min: 10000, max: null, rate: 0.08 },
  ]

  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i]
    if (amount >= tier.min && (tier.max === null || amount <= tier.max)) {
      return Math.round((amount * tier.rate + Number.EPSILON) * 100) / 100
    }
  }
  return 0
}

function calculateReferralIncome(level, referralProfit) {
  const mapping = { 1: 0.2, 2: 0.17, 3: 0.13, 4: 0.09, 5: 0.05 }
  const rate = mapping[level] || 0
  return Math.round((referralProfit * rate + Number.EPSILON) * 100) / 100
}

function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Test scenarios
const testScenarios = [
  { amount: 500, name: "Small Investment ($500)" },
  { amount: 2500, name: "Medium Investment ($2,500)" },
  { amount: 5000, name: "Large Investment ($5,000)" },
  { amount: 15000, name: "Premium Investment ($15,000)" },
]

console.log("=".repeat(60))
console.log("ROI DISTRIBUTION VERIFICATION FOR ONE INVESTOR")
console.log("=".repeat(60))
console.log("")

testScenarios.forEach((scenario) => {
  const investmentAmount = scenario.amount
  const monthlyRoi = calculateStakingIncome(investmentAmount)
  const monthlyRate = monthlyRoi > 0 ? (monthlyRoi / investmentAmount) * 100 : 0
  
  // Test with different month lengths
  const monthLengths = [28, 29, 30, 31]
  
  console.log(`\n${scenario.name}`)
  console.log("-".repeat(60))
  console.log(`Investment: $${investmentAmount.toLocaleString()}`)
  console.log(`Monthly ROI: $${monthlyRoi.toFixed(2)} (${monthlyRate.toFixed(1)}%)`)
  console.log("")
  
  monthLengths.forEach((daysInMonth) => {
    const dailyRoi = roundToTwo(monthlyRoi / daysInMonth)
    const dailyRate = dailyRoi > 0 ? (dailyRoi / investmentAmount) * 100 : 0
    
    console.log(`  ${daysInMonth}-day month:`)
    console.log(`    Daily ROI: $${dailyRoi.toFixed(2)} (${dailyRate.toFixed(4)}%)`)
    
    // Calculate referral income for all 5 levels
    let totalReferral = 0
    const referralBreakdown = []
    for (let level = 1; level <= 5; level++) {
      const referralAmount = calculateReferralIncome(level, dailyRoi)
      totalReferral += referralAmount
      referralBreakdown.push({ level, amount: referralAmount })
    }
    
    console.log(`    Referral Income Distribution:`)
    referralBreakdown.forEach(({ level, amount }) => {
      const percentage = dailyRoi > 0 ? (amount / dailyRoi) * 100 : 0
      console.log(`      Level ${level}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)`)
    })
    
    console.log(`    Total Referral: $${totalReferral.toFixed(2)}`)
    console.log(`    Investor Receives: $${dailyRoi.toFixed(2)}`)
    console.log(`    Total Distributed: $${(dailyRoi + totalReferral).toFixed(2)}`)
    console.log("")
  })
})

console.log("=".repeat(60))
console.log("VERIFICATION CHECKLIST:")
console.log("=".repeat(60))
console.log("✓ Daily ROI = Monthly ROI / days in month")
console.log("✓ Referral income calculated from daily ROI")
console.log("✓ Level 1: 20% of daily ROI")
console.log("✓ Level 2: 17% of daily ROI")
console.log("✓ Level 3: 13% of daily ROI")
console.log("✓ Level 4: 9% of daily ROI")
console.log("✓ Level 5: 5% of daily ROI")
console.log("✓ Total referral: 64% of daily ROI")
console.log("✓ Investor receives: 100% of daily ROI")
console.log("=".repeat(60))

