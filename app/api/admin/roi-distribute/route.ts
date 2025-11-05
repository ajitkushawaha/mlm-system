import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { Transaction, RoiMeta } from "@/lib/models/Transaction"
import { calculateStakingIncome } from "@/lib/staking-calculator"
import { recordReferralIncome } from "@/lib/mlmLogic"

async function isAdmin(userId: string): Promise<boolean> {
  const db = await getDatabase()
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
  return user?.role === "admin"
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

async function getUplineChain(
  userId: ObjectId,
  db: Awaited<ReturnType<typeof getDatabase>>,
  maxLevel: number = 5,
): Promise<Array<{ userId: ObjectId; level: number }>> {
  const chain: Array<{ userId: ObjectId; level: number }> = []
  let currentUserId: ObjectId | undefined = userId
  let level = 1

  while (currentUserId && level <= maxLevel) {
    const user: User | null = await db.collection<User>("users").findOne({ _id: currentUserId })
    if (!user || !user.sponsorId) break

    const sponsor: User | null = await db.collection<User>("users").findOne({ _id: user.sponsorId })
    if (!sponsor || !sponsor._id) break

    chain.push({ userId: sponsor._id, level })

    currentUserId = sponsor._id
    level++
  }

  return chain
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = await getDatabase()

    // Find all users with active investments
    const investors = await db
      .collection<User>("users")
      .find({
        investmentAmount: { $gt: 0 },
      })
      .toArray()

    let processed = 0
    let totalRoi = 0
    const currentDate = new Date()
    const currentMonth = currentDate.toISOString().slice(0, 7) // YYYY-MM

    for (const investor of investors) {
      if (!investor.investmentAmount || investor.investmentAmount <= 0) continue

      // Check if ROI was already credited this month
      const lastCreditDate = investor.lastRoiCreditDate
      if (lastCreditDate) {
        const lastCreditMonth = new Date(lastCreditDate).toISOString().slice(0, 7)
        if (lastCreditMonth === currentMonth) {
          continue // Skip if already credited this month
        }
      }

      // Calculate tiered monthly ROI using staking income logic
      const roiAmount = calculateStakingIncome(investor.investmentAmount)
      const roiRate = roiAmount === 0 ? 0 : roundToTwo(roiAmount / investor.investmentAmount)
      const roiPercentage = roundToTwo(roiRate * 100)

      // Credit ROI to normalWallet
      await db.collection<User>("users").updateOne(
        { _id: investor._id },
        {
          $inc: {
            normalWallet: roiAmount,
            totalEarnings: roiAmount,
          },
          $set: {
            lastRoiCreditDate: currentDate,
          },
        },
      )

      // Create ROI transaction
      const roiTransaction: Transaction<RoiMeta> = {
        userId: investor._id!.toString(),
        type: "roi",
        amount: roiAmount,
        currency: "USD",
        createdAt: currentDate,
        meta: {
          investmentAmount: investor.investmentAmount,
          roiRate: roiRate,
          roiPercentage: roiPercentage,
          period: currentMonth,
          note: `Monthly ROI from $${investor.investmentAmount} investment (${roiPercentage}% tier)`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(roiTransaction)

      // Distribute referral income to upline (up to 5 levels)
      const uplineChain = await getUplineChain(investor._id!, db, 5)
      
      for (const upline of uplineChain) {
        const referralCommission = await recordReferralIncome(
          upline.userId.toString(),
          upline.level,
          roiAmount,
          investor._id!.toString(),
          "USD",
          db,
        )

        // Credit referral income to upline's normalWallet
        await db.collection<User>("users").updateOne(
          { _id: upline.userId },
          {
            $inc: {
              normalWallet: referralCommission.amount,
              totalEarnings: referralCommission.amount,
            },
          },
        )
      }

      processed++
      totalRoi += roiAmount
    }

    return NextResponse.json({
      message: "ROI distribution completed",
      processed,
      totalRoi: roundToTwo(totalRoi),
      month: currentMonth,
    })
  } catch (error) {
    console.error("ROI distribution error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

