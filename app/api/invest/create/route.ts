import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { Transaction, TransferMeta } from "@/lib/models/Transaction"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || typeof amount !== "number") {
      return NextResponse.json({ error: "Valid investment amount is required" }, { status: 400 })
    }

    // Validate investment range (minimum $100, no maximum)
    if (amount < 100) {
      return NextResponse.json({ error: "Investment amount must be at least $100" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has sufficient balance in normalWallet
    const normalWallet = user.normalWallet || user.currentBalance || 0
    if (normalWallet < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${normalWallet}, Required: $${amount}` },
        { status: 400 },
      )
    }

    // Get existing investment amount (from investmentAmount or shakingWallet)
    const existingInvestmentAmount = user.investmentAmount || 0
    const existingShakingWallet = user.shakingWallet || 0
    const existingInvestment = existingInvestmentAmount || existingShakingWallet
    const isFirstInvestment = existingInvestment === 0

    // Calculate new total investment amount
    const newInvestmentAmount = existingInvestment + amount

    // Update user: transfer from normalWallet to shakingWallet
    // Increment investment amounts to allow cumulative investments
    const updateOperation: {
      $inc: { normalWallet: number; shakingWallet: number }
      $set: Record<string, unknown>
      $unset?: Record<string, 1 | "" | true>
    } = {
      $inc: {
        normalWallet: -amount,
        shakingWallet: amount,
      },
      $set: {
        investmentAmount: newInvestmentAmount, // Set total investment amount
      },
      $unset: {
        investmentLockPeriod: "",
        investmentUnlockDate: "",
      },
    }

    // Set investmentDate only for first investment, keep original date for subsequent investments
    if (isFirstInvestment) {
      updateOperation.$set.investmentDate = new Date()
      updateOperation.$set.lastRoiCreditDate = undefined
      updateOperation.$set.lastDailyRoiCreditDate = undefined // Reset daily ROI tracking for new investment
    }

    await db.collection<User>("users").updateOne(
      { _id: user._id },
      updateOperation,
    )

    // Create transfer transaction (Normal → Staking)
    const transferTransaction: Transaction<TransferMeta> = {
      userId: user._id!.toString(),
      type: "transfer",
      amount: amount,
      currency: "USD",
      createdAt: new Date(),
      meta: {
        fromWallet: "normal",
        toWallet: "staking",
        transferType: "user",
        note: `Investment transfer: $${amount} to Staking Wallet`,
      },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    return NextResponse.json({
      message: "Investment created successfully",
      investmentAmount: newInvestmentAmount,
      addedAmount: amount,
    })
  } catch (error) {
    console.error("Investment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      {
        projection: {
          investmentAmount: 1,
          investmentDate: 1,
          investmentLockPeriod: 1,
          investmentUnlockDate: 1,
          lastRoiCreditDate: 1,
          shakingWallet: 1,
        },
      },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      investmentAmount: user.investmentAmount || 0,
      investmentDate: user.investmentDate,
      investmentLockPeriod: user.investmentLockPeriod,
      investmentUnlockDate: user.investmentUnlockDate,
      lastRoiCreditDate: user.lastRoiCreditDate,
      shakingWallet: user.shakingWallet || 0,
    })
  } catch (error) {
    console.error("Get investment status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

