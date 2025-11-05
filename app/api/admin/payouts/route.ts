import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { PayoutCalculator } from "@/lib/payout-calculator"
import { ObjectId } from "mongodb"
import type { User, Payout } from "@/lib/models/User"
import type { Transaction } from "@/lib/models/Transaction"

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

    // Get transactions (earning types: generation, referral, roi, activation)
    const earningTypes: Array<"generation" | "referral" | "roi" | "activation"> = ["generation", "referral", "roi", "activation"]
    
    // Get all transactions with user details
    const transactionsRaw = await db
      .collection<Transaction>("transactions")
      .find({
        type: { $in: earningTypes },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Get user details for transactions
    const transactions = await Promise.all(
      transactionsRaw.map(async (t) => {
        const user = await db
          .collection<User>("users")
          .findOne({ _id: new ObjectId(t.userId) }, { projection: { name: 1, email: 1, membershipLevel: 1 } })
        return { ...t, user: user || { name: "Unknown", email: "N/A", membershipLevel: "green" } }
      }),
    )

    // Get old payouts with user details
    const oldPayouts = await db
      .collection<Payout>("payouts")
      .aggregate([
        { $sort: { createdAt: -1 } },
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

    // Combine old payouts with transactions for display
    const allPayoutsFull = [
      ...oldPayouts.map((p) => ({
        _id: p._id?.toString() || "",
        userId: p.userId.toString(),
        user: p.user,
        type: p.type as string,
        level: p.level,
        amount: p.amount,
        netAmount: p.netAmount || p.amount,
        tdsAmount: p.tdsAmount,
        createdAt: p.createdAt,
        cycleTime: p.cycleTime,
        source: "old" as const,
      })),
      ...transactions.map((t) => {
        const meta = t.meta as { level?: number } & Record<string, unknown>
        const user = (t as Transaction & { user?: User }).user || { name: "Unknown", email: "N/A", membershipLevel: "green" as const }
        return {
          _id: t._id?.toString() || "",
          userId: t.userId,
          user: user,
          type: t.type,
          level: meta?.level,
          amount: t.amount,
          netAmount: t.amount,
          tdsAmount: 0,
          createdAt: t.createdAt,
          cycleTime: undefined,
          source: "transaction" as const,
          meta: t.meta,
        }
      }),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const totalCount = allPayoutsFull.length

    // Calculate statistics from all payouts (before pagination)
    const totalAmount = allPayoutsFull.reduce((sum, p) => sum + p.amount, 0)
    const totalNet = allPayoutsFull.reduce((sum, p) => sum + (p.netAmount || p.amount), 0)
    const totalTDS = allPayoutsFull.reduce((sum, p) => sum + (p.tdsAmount || 0), 0)
    const avgPayout = allPayoutsFull.length > 0 ? totalNet / allPayoutsFull.length : 0

    // Apply pagination
    const allPayouts = allPayoutsFull.slice(skip, skip + limit)

    return NextResponse.json({
      payouts: allPayouts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalPayouts: totalCount,
        totalAmount,
        totalTDS,
        totalNet,
        avgPayout,
      },
      levelStats: [], // Can be calculated if needed
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
