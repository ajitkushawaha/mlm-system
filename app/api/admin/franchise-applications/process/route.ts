import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import type { FranchiseApplication } from "@/lib/models/FranchiseApplication"
import type { User } from "@/lib/models/User"
import type { Transaction, TransferMeta } from "@/lib/models/Transaction"
import { ObjectId } from "mongodb"

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

    const { applicationId, action, rejectionReason } = await request.json()

    if (!applicationId || !action) {
      return NextResponse.json({ error: "Application ID and action are required" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const application = await db
      .collection<FranchiseApplication>("franchiseApplications")
      .findOne({ _id: new ObjectId(applicationId) })

    if (!application) {
      return NextResponse.json({ error: "Franchise application not found" }, { status: 404 })
    }

    if (application.status !== "pending") {
      return NextResponse.json({ error: "Franchise application has already been processed" }, { status: 400 })
    }

    const adminId = new ObjectId(decoded.userId)
    const now = new Date()

    if (action === "approve") {
      // Get user
      const user = await db.collection<User>("users").findOne({ _id: application.userId })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Calculate total credit (amount + bonus)
      const totalCredit = application.totalCredit || application.amount
      const bonusAmount = application.bonusAmount || 0
      
      // Update user to franchise member and credit franchise wallet
      await db.collection<User>("users").updateOne(
        { _id: application.userId },
        {
          $set: {
            role: "franchise",
            franchiseStatus: "approved",
            franchisePurchaseDate: now,
          },
          $inc: {
            franchiseWallet: totalCredit, // Credit amount + bonus to franchise wallet
          },
        },
      )

      // Create transaction record
      const transaction: Transaction<TransferMeta> = {
        userId: application.userId.toString(),
        type: "transfer",
        amount: totalCredit,
        currency: application.currency,
        createdAt: now,
        meta: {
          fromWallet: "normal",
          toWallet: "franchise",
          transferType: "admin",
          note: bonusAmount > 0
            ? `Franchise membership approved: $${application.amount} + $${bonusAmount} bonus = $${totalCredit} credited to Franchise Wallet`
            : `Franchise membership approved: $${application.amount} credited to Franchise Wallet`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(transaction)

      // Update franchise application
      await db.collection<FranchiseApplication>("franchiseApplications").updateOne(
        { _id: application._id },
        {
          $set: {
            status: "approved",
            processedAt: now,
            processedBy: adminId,
          },
        },
      )

      return NextResponse.json({
        message: "Franchise application approved and credited to user's Franchise Wallet",
        amount: application.amount,
        bonusAmount: bonusAmount,
        totalCredit: totalCredit,
      })
    } else {
      // Reject franchise application
      await db.collection<FranchiseApplication>("franchiseApplications").updateOne(
        { _id: application._id },
        {
          $set: {
            status: "rejected",
            processedAt: now,
            processedBy: adminId,
            rejectionReason,
          },
        },
      )

      // Update user status
      await db.collection<User>("users").updateOne(
        { _id: application.userId },
        {
          $set: {
            franchiseStatus: "rejected",
          },
        },
      )

      return NextResponse.json({
        message: "Franchise application rejected",
      })
    }
  } catch (error) {
    console.error("Process franchise application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

