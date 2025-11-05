import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { WithdrawalRequest } from "@/lib/models/WithdrawalRequest"
import type { Transaction, TransferMeta } from "@/lib/models/Transaction"

async function isAdmin(userId: string): Promise<boolean> {
  const db = await getDatabase()
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
  return user?.role === "admin"
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

    const { requestId, action, rejectionReason } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const withdrawalRequest = await db
      .collection<WithdrawalRequest>("withdrawalRequests")
      .findOne({ _id: new ObjectId(requestId) })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 })
    }

    if (withdrawalRequest.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal request has already been processed" }, { status: 400 })
    }

    const user = await db.collection<User>("users").findOne({ _id: withdrawalRequest.userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentDate = new Date()

    if (action === "approve") {
      // Check if user still has sufficient balance
      const availableBalance = user.normalWallet ?? user.currentBalance ?? 0
      if (availableBalance < withdrawalRequest.amount) {
        return NextResponse.json(
          { error: `User has insufficient balance. Available: $${availableBalance.toFixed(2)}` },
          { status: 400 },
        )
      }

      // Deduct from user's normalWallet
      await db.collection<User>("users").updateOne(
        { _id: withdrawalRequest.userId },
        {
          $inc: {
            normalWallet: -withdrawalRequest.amount,
            currentBalance: -withdrawalRequest.amount, // For backward compatibility
          },
        },
      )

      // Create transaction record
      const transaction: Transaction<TransferMeta> = {
        userId: withdrawalRequest.userId.toString(),
        type: "transfer",
        amount: -withdrawalRequest.amount,
        currency: "USD",
        createdAt: currentDate,
        meta: {
          fromWallet: "normal",
          toWallet: "normal", // Withdrawal goes to external, but we use "normal" as placeholder
          transferType: "admin",
          note: `Withdrawal approved: $${withdrawalRequest.amount}`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(transaction)

      // Update withdrawal request status
      await db.collection<WithdrawalRequest>("withdrawalRequests").updateOne(
        { _id: withdrawalRequest._id },
        {
          $set: {
            status: "approved",
            processedAt: currentDate,
            processedBy: new ObjectId(decoded.userId),
          },
        },
      )
    } else {
      // Reject withdrawal request
      await db.collection<WithdrawalRequest>("withdrawalRequests").updateOne(
        { _id: withdrawalRequest._id },
        {
          $set: {
            status: "rejected",
            processedAt: currentDate,
            processedBy: new ObjectId(decoded.userId),
            rejectionReason: rejectionReason,
          },
        },
      )
    }

    return NextResponse.json({
      message: `Withdrawal request ${action}d successfully`,
      requestId: requestId,
    })
  } catch (error) {
    console.error("Process withdrawal request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

