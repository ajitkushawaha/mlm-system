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
          shakingWallet: 1,
        },
      },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      investmentAmount: user.investmentAmount || 0,
      investmentDate: user.investmentDate,
      investmentLockPeriod: user.investmentLockPeriod,
      investmentUnlockDate: user.investmentUnlockDate,
      lastRoiCreditDate: user.lastRoiCreditDate,
      shakingWallet: user.shakingWallet || 0,
    })
  } catch (error) {
    console.error("Get investment status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

