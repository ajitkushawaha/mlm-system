import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      {
        projection: {
          investmentAmount: 1,
          investmentDate: 1,
          investmentLockPeriod: 1,
          investmentUnlockDate: 1,
          lastRoiCreditDate: 1,
          lastDailyRoiCreditDate: 1,
          shakingWallet: 1,
        },
      },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Use effective investment amount - prefer shakingWallet as source of truth, 
    // but use the maximum of both to handle any inconsistencies
    const investmentAmount = user.investmentAmount || 0
    const shakingWallet = user.shakingWallet || 0
    const effectiveInvestmentAmount = Math.max(investmentAmount, shakingWallet)

    return NextResponse.json({
      investmentAmount: effectiveInvestmentAmount,
      investmentDate: user.investmentDate,
      investmentLockPeriod: user.investmentLockPeriod,
      investmentUnlockDate: user.investmentUnlockDate,
      lastRoiCreditDate: user.lastRoiCreditDate,
      lastDailyRoiCreditDate: user.lastDailyRoiCreditDate,
      shakingWallet: shakingWallet,
    })
  } catch (error) {
    console.error("Get investment status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

