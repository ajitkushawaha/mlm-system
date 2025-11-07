import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { Payout, User } from "@/lib/models/User"
import type { Transaction } from "@/lib/models/Transaction"

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
    const userIdString = userId.toString()

    // Get user to access totalEarnings from transactions
    const user = await db.collection<User>("users").findOne({ _id: userId }, { projection: { totalEarnings: 1 } })

    // Get transactions (earning types: generation, referral, roi, activation)
    // Also include withdrawals and deposits (transfer type with specific notes)
    const earningTypes: Array<"generation" | "referral" | "roi" | "activation"> = ["generation", "referral", "roi", "activation"]
    
    // Get earning transactions
    const earningTransactions = await db
      .collection<Transaction>("transactions")
      .find({
        userId: userIdString,
        type: { $in: earningTypes },
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Get withdrawal and deposit transactions (transfer type with specific notes)
    const transferTransactions = await db
      .collection<Transaction>("transactions")
      .find({
        userId: userIdString,
        type: "transfer",
        $or: [
          { "meta.note": { $regex: "Withdrawal approved", $options: "i" } },
          { "meta.note": { $regex: "Deposit approved", $options: "i" } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Combine all transactions and sort by date
    const allTransactions = [...earningTransactions, ...transferTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Apply pagination
    const transactions = allTransactions.slice(skip, skip + limit)
    
    // Debug: Check if user has investment but no ROI transactions yet
    // This helps identify if ROI hasn't been distributed or if there's a userId mismatch
    // If no transactions found, user may have investment but no ROI transactions yet
    // ROI transactions will be included in the main query when they exist

    // Get total count for pagination (earnings + withdrawals/deposits)
    const earningCount = await db
      .collection<Transaction>("transactions")
      .countDocuments({
        userId: userIdString,
        type: { $in: earningTypes },
      })
    
    const transferCount = await db
      .collection<Transaction>("transactions")
      .countDocuments({
        userId: userIdString,
        type: "transfer",
        $or: [
          { "meta.note": { $regex: "Withdrawal approved", $options: "i" } },
          { "meta.note": { $regex: "Deposit approved", $options: "i" } }
        ]
      })
    
    const totalCount = earningCount + transferCount

    // Calculate summary statistics from transactions
    const transactionSummary = await db
      .collection<Transaction>("transactions")
      .aggregate([
        {
          $match: {
            userId: userIdString,
            type: { $in: earningTypes },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$amount" },
            totalPayouts: { $sum: 1 },
            avgPayout: { $avg: "$amount" },
          },
        },
      ])
      .toArray()

    // Also get old payouts for backward compatibility
    const oldPayouts = await db
      .collection<Payout>("payouts")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const oldPayoutCount = await db.collection<Payout>("payouts").countDocuments({ userId })

    // Combine old payouts with transactions for display
    const allPayouts = [
      ...oldPayouts.map((p) => ({
        _id: p._id?.toString() || "",
        type: p.type as string,
        level: p.level,
        amount: p.netAmount || p.amount,
        createdAt: p.createdAt,
        cycleTime: p.cycleTime,
        pairDetails: p.pairDetails,
        source: "old" as const,
        isDebit: false, // Old payouts are always credits
      })),
      ...transactions.map((t) => {
        const transferMeta = t.meta as { note?: string; transferType?: string } | undefined
        const isWithdrawal = t.type === "transfer" && transferMeta?.note?.includes("Withdrawal approved")
        const isDeposit = t.type === "transfer" && transferMeta?.note?.includes("Deposit approved")
        
        return {
          _id: t._id?.toString() || "",
          type: isWithdrawal ? "withdrawal" : isDeposit ? "deposit" : t.type,
          level: undefined,
          amount: Math.abs(t.amount), // Always show positive amount, use isDebit flag for sign
          createdAt: t.createdAt,
          cycleTime: undefined,
          pairDetails: undefined,
          source: "transaction" as const,
          meta: t.meta,
          isDebit: isWithdrawal, // true for withdrawals, false for deposits and earnings
        }
      }),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit) // Apply pagination

    // Use transaction summary (or fallback to old payout system)
    const summary = transactionSummary[0] || {
      totalEarnings: 0,
      totalPayouts: 0,
      avgPayout: 0,
    }

    // Add old payouts count if any
    summary.totalPayouts = summary.totalPayouts + oldPayoutCount

    // Override totalEarnings with user.totalEarnings (most accurate)
    summary.totalEarnings = user?.totalEarnings || 0

    // Recalculate average if we have both transactions and old payouts
    if (summary.totalPayouts > 0) {
      summary.avgPayout = summary.totalEarnings / summary.totalPayouts
    }

    return NextResponse.json({
      payouts: allPayouts,
      pagination: {
        page,
        limit,
        totalCount: totalCount + oldPayoutCount,
        totalPages: Math.ceil((totalCount + oldPayoutCount) / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Payout history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
