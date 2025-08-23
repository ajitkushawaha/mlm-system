import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { PayoutCalculator } from "@/lib/payout-calculator"
import { ObjectId } from "mongodb"
import type { User, Payout } from "@/lib/models/User"

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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const db = await getDatabase()

    // Get recent payouts with user details
    const payouts = await db
      .collection<Payout>("payouts")
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { name: 1, email: 1, membershipLevel: 1 } }],
          },
        },
        { $unwind: "$user" },
      ])
      .toArray()

    const totalCount = await db.collection<Payout>("payouts").countDocuments()

    // Get payout statistics
    const stats = await db
      .collection<Payout>("payouts")
      .aggregate([
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            totalTDS: { $sum: "$tdsAmount" },
            totalNet: { $sum: "$netAmount" },
            avgPayout: { $avg: "$netAmount" },
          },
        },
      ])
      .toArray()

    // Get payouts by level
    const levelStats = await db
      .collection<Payout>("payouts")
      .aggregate([
        {
          $group: {
            _id: "$level",
            count: { $sum: 1 },
            totalAmount: { $sum: "$netAmount" },
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
      stats: stats[0] || {
        totalPayouts: 0,
        totalAmount: 0,
        totalTDS: 0,
        totalNet: 0,
        avgPayout: 0,
      },
      levelStats,
    })
  } catch (error) {
    console.error("Admin payouts fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

    const { action } = await request.json()

    if (action === "run-cycle") {
      const calculator = new PayoutCalculator()
      const result = await calculator.runPayoutCycle()

      return NextResponse.json({
        message: "Payout cycle completed",
        processed: result.processed,
        totalAmount: result.totalAmount,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin payout action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
