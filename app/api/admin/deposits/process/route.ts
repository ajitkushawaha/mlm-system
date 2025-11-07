import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { DepositRequest } from "@/lib/models/DepositRequest"
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { requestId, action, rejectionReason } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const depositRequest = await db
      .collection<DepositRequest>("depositRequests")
      .findOne({ _id: new ObjectId(requestId) })

    if (!depositRequest) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 })
    }

    if (depositRequest.status !== "pending") {
      return NextResponse.json({ error: "Deposit request has already been processed" }, { status: 400 })
    }

    const adminId = new ObjectId(decoded.userId)
    const now = new Date()

    if (action === "approve") {
      // Credit user's Main Wallet
      await db.collection<User>("users").updateOne(
        { _id: depositRequest.userId },
        {
          $inc: {
            normalWallet: depositRequest.amount,
            currentBalance: depositRequest.amount,
            totalEarnings: depositRequest.amount,
          },
        },
      )

      // Create transaction record
      const transaction: Transaction<TransferMeta> = {
        userId: depositRequest.userId.toString(),
        type: "transfer",
        amount: depositRequest.amount,
        currency: depositRequest.currency,
        createdAt: now,
        meta: {
          fromWallet: "normal",
          toWallet: "normal",
          transferType: "admin",
          note: `Deposit approved: $${depositRequest.amount} credited to Main Wallet`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(transaction)

      // Update deposit request
      await db.collection<DepositRequest>("depositRequests").updateOne(
        { _id: depositRequest._id },
        {
          $set: {
            status: "approved",
            processedAt: now,
            processedBy: adminId,
          },
        },
      )

      return NextResponse.json({
        message: "Deposit approved and credited to user's Main Wallet",
        amount: depositRequest.amount,
      })
    } else {
      // Reject deposit request
      await db.collection<DepositRequest>("depositRequests").updateOne(
        { _id: depositRequest._id },
        {
          $set: {
            status: "rejected",
            processedAt: now,
            processedBy: adminId,
            rejectionReason,
          },
        },
      )

      return NextResponse.json({
        message: "Deposit request rejected",
      })
    }
  } catch (error) {
    console.error("Process deposit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

