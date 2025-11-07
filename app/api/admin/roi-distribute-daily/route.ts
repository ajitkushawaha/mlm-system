import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { Transaction, RoiMeta } from "@/lib/models/Transaction"
import { calculateStakingIncome } from "@/lib/staking-calculator"
import { recordReferralIncome } from "@/lib/mlmLogic"

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

/**
 * Daily ROI Distribution - Automatic
 * This endpoint can be called by cron jobs or scheduled tasks
 * Calculates daily ROI = Monthly ROI / 30 days
 * Credits ROI to investors and distributes referral income to upline
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for API key or admin token for security
    const authHeader = request.headers.get("authorization")
    const apiKey = process.env.CRON_SECRET_KEY
    
    // If API key is set, require it for security
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      // Allow admin token as fallback for manual triggers
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        const { verifyToken } = await import("@/lib/auth")
        const decoded = verifyToken(token)
        if (decoded) {
          const dbCheck = await getDatabase()
          const user = await dbCheck.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })
          if (user?.role !== "admin") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
          }
        } else {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const db = await getDatabase()

    // Find all users with active investments
    // Check both investmentAmount and shakingWallet to catch all investments
    const investors = await db
      .collection<User>("users")
      .find({
        $or: [
          { investmentAmount: { $gt: 0 } },
          { shakingWallet: { $gt: 0 } }
        ]
      })
      .toArray()

    let processed = 0
    let skipped = 0
    let totalRoi = 0
    const currentDate = new Date()
    const currentDateStr = currentDate.toISOString().split("T")[0] // YYYY-MM-DD

    for (const investor of investors) {
      // Use investmentAmount if set, otherwise use shakingWallet as fallback
      const effectiveInvestmentAmount = investor.investmentAmount || investor.shakingWallet || 0
      
      if (effectiveInvestmentAmount <= 0) {
        continue
      }

      // If investmentDate is not set, use current date (for investments created before this field was added)
      if (!investor.investmentDate) {
        await db.collection<User>("users").updateOne(
          { _id: investor._id },
          { $set: { investmentDate: currentDate } }
        )
      }

      // Check if ROI was already credited today
      const lastCreditDate = investor.lastDailyRoiCreditDate
      if (lastCreditDate) {
        const lastCreditDateStr = new Date(lastCreditDate).toISOString().split("T")[0]
        if (lastCreditDateStr === currentDateStr) {
          skipped++ // Skip if already credited today
          continue
        }
      }

      // Calculate monthly ROI first (use effective investment amount)
      const monthlyRoi = calculateStakingIncome(effectiveInvestmentAmount)
      
      // Calculate actual number of days in current month
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() // 0-11
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate() // Get last day of month
      
      // Calculate daily ROI = Monthly ROI / actual days in current month
      const dailyRoi = roundToTwo(monthlyRoi / daysInMonth)
      
      if (dailyRoi <= 0) {
        skipped++
        continue
      }

      const roiRate = roundToTwo(dailyRoi / effectiveInvestmentAmount)
      const roiPercentage = roundToTwo(roiRate * 100)

      // Credit daily ROI to normalWallet
      await db.collection<User>("users").updateOne(
        { _id: investor._id },
        {
          $inc: {
            normalWallet: dailyRoi,
            totalEarnings: dailyRoi,
          },
          $set: {
            lastDailyRoiCreditDate: currentDate,
            // Keep lastRoiCreditDate for backward compatibility
            lastRoiCreditDate: currentDate,
          },
        },
      )

      // Create daily ROI transaction
      const roiTransaction: Transaction<RoiMeta> = {
        userId: investor._id!.toString(),
        type: "roi",
        amount: dailyRoi,
        currency: "USD",
        createdAt: currentDate,
        meta: {
          investmentAmount: effectiveInvestmentAmount,
          roiRate: roiRate,
          roiPercentage: roiPercentage,
          period: currentDateStr, // Daily period
          note: `Daily ROI from $${effectiveInvestmentAmount} investment (${roiPercentage}% daily, ${roundToTwo((monthlyRoi / effectiveInvestmentAmount) * 100)}% monthly, ${daysInMonth} days in month)`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(roiTransaction)

      // Distribute referral income to upline (up to 5 levels)
      // Calculate referral income based on daily ROI
      const uplineChain = await getUplineChain(investor._id!, db, 5)
      
      for (const upline of uplineChain) {
        const referralCommission = await recordReferralIncome(
          upline.userId.toString(),
          upline.level,
          dailyRoi, // Use daily ROI for referral calculation
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
      totalRoi += dailyRoi
    }

    return NextResponse.json({
      message: "Daily ROI distribution completed",
      processed,
      skipped,
      totalRoi: roundToTwo(totalRoi),
      date: currentDateStr,
      timestamp: currentDate.toISOString(),
      found: investors.length, // Add count of found investors for debugging
    })
  } catch (error) {
    console.error("Daily ROI distribution error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Allow GET for easy testing and cron job setup
export async function GET(request: NextRequest) {
  return POST(request)
}

