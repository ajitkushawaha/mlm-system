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
    const userId = new ObjectId(decoded.userId)

    // Get direct referrals
    const directReferrals = await db
      .collection<User>("users")
      .find({ sponsorId: userId }, { projection: { password: 0 } })
      .sort({ joinDate: -1 })
      .toArray()

    // Get referral statistics
    const stats = await db
      .collection<User>("users")
      .aggregate([
        { $match: { sponsorId: userId } },
        {
          $group: {
            _id: null,
            totalReferrals: { $sum: 1 },
            activeReferrals: { $sum: { $cond: ["$isActive", 1, 0] } },
            greenReferrals: { $sum: { $cond: [{ $eq: ["$membershipLevel", "green"] }, 1, 0] } },
            blueReferrals: { $sum: { $cond: [{ $eq: ["$membershipLevel", "blue"] }, 1, 0] } },
            goldReferrals: { $sum: { $cond: [{ $eq: ["$membershipLevel", "gold"] }, 1, 0] } },
            totalEarningsFromReferrals: { $sum: "$totalEarnings" },
          },
        },
      ])
      .toArray()

    // Calculate potential direct bonus earnings
    const directBonusEarnings = await db
      .collection("payouts")
      .aggregate([
        { $match: { userId, type: "direct" } },
        { $group: { _id: null, totalDirectBonus: { $sum: "$netAmount" } } },
      ])
      .toArray()

    // Get recent referral activity
    const recentActivity = await db
      .collection<User>("users")
      .find({ sponsorId: userId })
      .sort({ joinDate: -1 })
      .limit(5)
      .project({ name: 1, email: 1, membershipLevel: 1, joinDate: 1, isActive: 1 })
      .toArray()

    return NextResponse.json({
      directReferrals,
      stats: stats[0] || {
        totalReferrals: 0,
        activeReferrals: 0,
        greenReferrals: 0,
        blueReferrals: 0,
        goldReferrals: 0,
        totalEarningsFromReferrals: 0,
      },
      directBonusEarnings: directBonusEarnings[0]?.totalDirectBonus || 0,
      recentActivity,
    })
  } catch (error) {
    console.error("Referral stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
