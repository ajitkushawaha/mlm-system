import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Payout } from "@/lib/models/User"

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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const db = await getDatabase()
    const userId = new ObjectId(decoded.userId)

    // Get payout history with pagination
    const payouts = await db
      .collection<Payout>("payouts")
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await db.collection<Payout>("payouts").countDocuments({ userId })

    // Calculate summary statistics
    const summary = await db
      .collection<Payout>("payouts")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$netAmount" },
            totalTDS: { $sum: "$tdsAmount" },
            totalPayouts: { $sum: 1 },
            avgPayout: { $avg: "$netAmount" },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: summary[0] || {
        totalEarnings: 0,
        totalTDS: 0,
        totalPayouts: 0,
        avgPayout: 0,
      },
    })
  } catch (error) {
    console.error("Payout history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
