import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
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
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 })
    }

    const { userId, force } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.investmentAmount || user.investmentAmount <= 0) {
      return NextResponse.json({ error: "User has no active investment" }, { status: 400 })
    }

    // Check if lock period has expired or force unlock
    const canUnlock = force || (user.investmentUnlockDate && new Date() >= new Date(user.investmentUnlockDate))

    if (!canUnlock) {
      return NextResponse.json(
        {
          error: `Investment is locked until ${new Date(user.investmentUnlockDate!).toLocaleDateString()}. Use force=true to override.`,
        },
        { status: 400 },
      )
    }

    const investmentAmount = user.investmentAmount
    const shakingWallet = user.shakingWallet || 0

    if (shakingWallet < investmentAmount) {
      return NextResponse.json(
        { error: `Insufficient Shaking Wallet balance. Available: $${shakingWallet}, Required: $${investmentAmount}` },
        { status: 400 },
      )
    }

    // Transfer from shakingWallet to normalWallet
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $inc: {
          shakingWallet: -investmentAmount,
          normalWallet: investmentAmount,
        },
        $set: {
          investmentAmount: 0,
          investmentDate: undefined,
          investmentLockPeriod: undefined,
          investmentUnlockDate: undefined,
          lastRoiCreditDate: undefined,
        },
      },
    )

    // Create transfer transaction (Shaking → Normal)
    const transferTransaction: Transaction<TransferMeta> = {
      userId: user._id!.toString(),
      type: "transfer",
      amount: investmentAmount,
      currency: "USD",
      createdAt: new Date(),
      meta: {
        fromWallet: "shaking",
        toWallet: "normal",
        transferType: "admin",
        note: `Investment unlocked: $${investmentAmount} returned to Normal Wallet`,
      },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    return NextResponse.json({
      message: "Investment unlocked successfully",
      amountReturned: investmentAmount,
    })
  } catch (error) {
    console.error("Investment unlock error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

