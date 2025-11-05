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

    // Check if user already has an active investment
    if (user.investmentAmount && user.investmentAmount > 0) {
      return NextResponse.json({ error: "You already have an active investment" }, { status: 400 })
    }

    // Check if user has sufficient balance in normalWallet
    const normalWallet = user.normalWallet || user.currentBalance || 0
    if (normalWallet < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${normalWallet}, Required: $${amount}` },
        { status: 400 },
      )
    }

    // Update user: transfer from normalWallet to shakingWallet
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $inc: {
          normalWallet: -amount,
          shakingWallet: amount,
        },
        $set: {
          investmentAmount: amount,
          investmentDate: new Date(),
          lastRoiCreditDate: undefined,
        },
        $unset: {
          investmentLockPeriod: "",
          investmentUnlockDate: "",
        },
      },
    )

    // Create transfer transaction (Normal → Shaking)
    const transferTransaction: Transaction<TransferMeta> = {
      userId: user._id!.toString(),
      type: "transfer",
      amount: amount,
      currency: "USD",
      createdAt: new Date(),
      meta: {
        fromWallet: "normal",
        toWallet: "shaking",
        transferType: "user",
        note: `Investment transfer: $${amount} to Shaking Wallet`,
      },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    return NextResponse.json({
      message: "Investment created successfully",
      investmentAmount: amount,
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

