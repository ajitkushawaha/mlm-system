import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

async function isAdmin(userId: string): Promise<boolean> {
  const db = await getDatabase()
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
  return user?.role === "admin"
}

export async function GET(request: NextRequest) {
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
    const investors = await db
      .collection<User>("users")
      .find({
        investmentAmount: { $gt: 0 },
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        investmentAmount: 1,
        investmentDate: 1,
        investmentLockPeriod: 1,
        investmentUnlockDate: 1,
        lastRoiCreditDate: 1,
        shakingWallet: 1,
      })
      .toArray()

    return NextResponse.json({
      investments: investors.map((inv) => ({
        _id: inv._id?.toString(),
        name: inv.name,
        email: inv.email,
        investmentAmount: inv.investmentAmount || 0,
        investmentDate: inv.investmentDate,
        investmentLockPeriod: inv.investmentLockPeriod,
        investmentUnlockDate: inv.investmentUnlockDate,
        lastRoiCreditDate: inv.lastRoiCreditDate,
        shakingWallet: inv.shakingWallet || 0,
      })),
    })
  } catch (error) {
    console.error("Get investments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

