import { getDatabase } from "./mongodb"
import type { ObjectId, Db } from "mongodb"
import type { User, Payout } from "./models/User"

// Platform Compensation Plan Constants
const TDS_RATE = 0.05 // 5% TDS
const GREEN_PAIR_AMOUNT = 800
const GREEN_UPGRADE_THRESHOLD = 6

// Blue ID progression steps with pair requirements and payouts
const BLUE_STEPS = [
  { step: 1, leftPairs: 9, rightPairs: 9, payout: 14000 },
  { step: 2, leftPairs: 16, rightPairs: 16, payout: 19859 },
  { step: 3, leftPairs: 50, rightPairs: 50, payout: 105000 },
  { step: 4, leftPairs: 150, rightPairs: 150, payout: 315000 },
  { step: 5, leftPairs: 500, rightPairs: 500, payout: 1575000 },
  { step: 6, leftPairs: 1000, rightPairs: 1000, payout: 5670000 },
  { step: 7, leftPairs: 2500, rightPairs: 2500, payout: 10150000 },
  { step: 8, leftPairs: 5000, rightPairs: 5000, payout: 101500000 },
  { step: 9, leftPairs: 10000, rightPairs: 10000, payout: 566500000 },
  { step: 10, leftPairs: 90000, rightPairs: 90000, payout: 5390000000 },
]

export class PayoutCalculator {
  private db!: Db

  constructor() {
    this.initDb()
  }

  private async initDb() {
    this.db = await getDatabase()
  }

  // Calculate TDS deduction
  private calculateTDS(amount: number): { grossAmount: number; tdsAmount: number; netAmount: number } {
    const tdsAmount = Math.round(amount * TDS_RATE)
    const netAmount = amount - tdsAmount
    return {
      grossAmount: amount,
      tdsAmount,
      netAmount,
    }
  }

  // Count pairs in user's network
  private async countPairs(userId: ObjectId): Promise<{ leftPairs: number; rightPairs: number }> {
    const user = await this.db.collection<User>("users").findOne({ _id: userId })
    if (!user) return { leftPairs: 0, rightPairs: 0 }

    // Count network size recursively
    const countNetworkSize = async (nodeId: ObjectId | undefined, visited = new Set()): Promise<number> => {
      if (!nodeId || visited.has(nodeId.toString())) return 0
      visited.add(nodeId.toString())

      const node = await this.db.collection<User>("users").findOne({ _id: nodeId })
      if (!node) return 0

      let count = 1
      if (node.leftChild) count += await countNetworkSize(node.leftChild, visited)
      if (node.rightChild) count += await countNetworkSize(node.rightChild, visited)

      return count
    }

    const leftPairs = await countNetworkSize(user.leftChild)
    const rightPairs = await countNetworkSize(user.rightChild)

    return { leftPairs, rightPairs }
  }

  // Calculate Green ID payouts
  async calculateGreenPayout(userId: ObjectId): Promise<Payout | null> {
    const user = await this.db.collection<User>("users").findOne({ _id: userId })
    if (!user || user.membershipLevel !== "green" || !user.boosterActive) return null

    const { left, right } = (await user.bluePairs) || { left: 0, right: 0 }
    const availablePairs = Math.min(left, right)

    if (availablePairs === 0) return null

    const { grossAmount, tdsAmount, netAmount } = this.calculateTDS(GREEN_PAIR_AMOUNT)

    const payout: Payout = {
      userId,
      amount: grossAmount,
      type: "pair",
      level: "green",
      tdsAmount,
      netAmount,
      pairDetails: {
        leftPairs: 1,
        rightPairs: 1,
      },
      createdAt: new Date(),
      cycleTime: this.getCurrentCycleTime(),
    }

    return payout
  }

  // Calculate Blue ID payouts
  async calculateBluePayout(userId: ObjectId): Promise<Payout | null> {
    const user = await this.db.collection<User>("users").findOne({ _id: userId })
    if (!user || user.membershipLevel !== "blue" || !user.boosterActive) return null

    const currentStep = user.blueStep || 0
    if (currentStep >= 10) return null // Already completed all steps

    const nextStep = BLUE_STEPS[currentStep]
    const { leftPairs, rightPairs } = await this.countPairs(userId)

    // Check if user has enough pairs for next step
    if (leftPairs >= nextStep.leftPairs && rightPairs >= nextStep.rightPairs) {
      const { grossAmount, tdsAmount, netAmount } = this.calculateTDS(nextStep.payout)

      const payout: Payout = {
        userId,
        amount: grossAmount,
        type: "pair",
        level: "blue",
        tdsAmount,
        netAmount,
        pairDetails: {
          leftPairs: nextStep.leftPairs,
          rightPairs: nextStep.rightPairs,
          step: nextStep.step,
        },
        createdAt: new Date(),
        cycleTime: this.getCurrentCycleTime(),
      }

      return payout
    }

    return null
  }

  // Calculate direct bonus for referrals
  async calculateDirectBonus(sponsorId: ObjectId): Promise<Payout | null> {
    const sponsor = await this.db.collection<User>("users").findOne({ _id: sponsorId })
    if (!sponsor || !sponsor.boosterActive) return null

    // Direct bonus amount based on membership level
    const bonusAmount = sponsor.membershipLevel === "gold" ? 200 : sponsor.membershipLevel === "blue" ? 150 : 100

    const { grossAmount, tdsAmount, netAmount } = this.calculateTDS(bonusAmount)

    const payout: Payout = {
      userId: sponsorId,
      amount: grossAmount,
      type: "direct",
      level: sponsor.membershipLevel,
      tdsAmount,
      netAmount,
      createdAt: new Date(),
      cycleTime: this.getCurrentCycleTime(),
    }

    return payout
  }

  // Process payout and update user records
  async processPayout(payout: Payout): Promise<boolean> {
    try {
      // Insert payout record
      await this.db.collection<Payout>("payouts").insertOne(payout)

      // Update user earnings and balance (normalWallet and currentBalance for backward compatibility)
      await this.db.collection<User>("users").updateOne(
        { _id: payout.userId },
        {
          $inc: {
            totalEarnings: payout.netAmount,
            normalWallet: payout.netAmount,
            currentBalance: payout.netAmount,
            totalTdsDeducted: payout.tdsAmount,
          },
        },
      )

      // Handle level-specific updates
      if (payout.level === "green" && payout.type === "pair") {
        const user = await this.db.collection<User>("users").findOne({ _id: payout.userId })
        const newPayoutCount = (user?.greenPayouts || 0) + 1

        const updateData: Record<string, unknown> = { greenPayouts: newPayoutCount }

        // Auto-upgrade to Blue ID after 6 payouts
        if (newPayoutCount >= GREEN_UPGRADE_THRESHOLD) {
          updateData.membershipLevel = "blue"
          updateData.blueStep = 0
        }

        await this.db.collection<User>("users").updateOne({ _id: payout.userId }, { $set: updateData })
      }

      if (payout.level === "blue" && payout.type === "pair" && payout.pairDetails?.step) {
        const updateData: Record<string, unknown> = { blueStep: payout.pairDetails.step }

        // Auto-upgrade to Gold ID after completing all 10 steps
        if (payout.pairDetails.step >= 10) {
          updateData.membershipLevel = "gold"
          updateData.goldActivated = true
        }

        await this.db.collection<User>("users").updateOne({ _id: payout.userId }, { $set: updateData })
      }

      return true
    } catch (error) {
      console.error("Payout processing error:", error)
      return false
    }
  }

  // Get current cycle time (12 AM - 12 PM or 12 PM - 12 AM)
  private getCurrentCycleTime(): "12am-12pm" | "12pm-12am" {
    const now = new Date()
    const hour = now.getHours()
    return hour < 12 ? "12am-12pm" : "12pm-12am"
  }

  // Run payout cycle for all eligible users
  async runPayoutCycle(): Promise<{ processed: number; totalAmount: number }> {
    let processed = 0
    let totalAmount = 0

    try {
      // Get all active users
      const activeUsers = await this.db
        .collection<User>("users")
        .find({ isActive: true, boosterActive: true })
        .toArray()

      for (const user of activeUsers) {
        let payout: Payout | null = null

        // Calculate payout based on membership level
        switch (user.membershipLevel) {
          case "green":
            payout = await this.calculateGreenPayout(user._id!)
            break
          case "blue":
            payout = await this.calculateBluePayout(user._id!)
            break
          case "gold":
            // Gold ID payouts would be calculated here (leadership, global sharing, etc.)
            break
        }

        if (payout && (await this.processPayout(payout))) {
          processed++
          totalAmount += payout.netAmount
        }
      }

      return { processed, totalAmount }
    } catch (error) {
      console.error("Payout cycle error:", error)
      return { processed, totalAmount }
    }
  }
}