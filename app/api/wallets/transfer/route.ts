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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { fromWallet, toWallet, amount, targetUserId } = await request.json()

    if (!fromWallet || !toWallet || !amount) {
      return NextResponse.json({ error: "fromWallet, toWallet, and amount are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const db = await getDatabase()
    const isAdminUser = await isAdmin(decoded.userId)

    // Admin can transfer to any user, regular users can only transfer their own funds
    const userId = targetUserId && isAdminUser ? targetUserId : decoded.userId
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate transfer rules
    const transferRules: Record<string, Record<string, (amount: number) => boolean>> = {
      normal: {
        franchise: (amt) => amt >= 100, // Minimum $100
        shaking: (amt) => amt >= 100 && amt <= 1000, // $100-$1000 only
      },
      shaking: {
        normal: () => {
          // Only if unlocked (admin can force)
          return isAdminUser
        },
      },
    }

    // Admin can transfer to any wallet
    if (!isAdminUser) {
      const rule = transferRules[fromWallet]?.[toWallet]
      if (!rule) {
        return NextResponse.json(
          { error: `Transfer from ${fromWallet} to ${toWallet} is not allowed` },
          { status: 400 },
        )
      }

      if (!rule(amount)) {
        if (fromWallet === "normal" && toWallet === "shaking") {
          return NextResponse.json(
            { error: "Transfer to Shaking Wallet must be between $100 and $1,000" },
            { status: 400 },
          )
        }
        if (fromWallet === "normal" && toWallet === "franchise") {
          return NextResponse.json(
            { error: "Transfer to Franchise Wallet must be at least $100" },
            { status: 400 },
          )
        }
        return NextResponse.json({ error: "Transfer not allowed" }, { status: 400 })
      }
    }

    // Get wallet balances (support legacy currentBalance)
    const getWalletBalance = (wallet: string): number => {
      switch (wallet) {
        case "normal":
          return user.normalWallet ?? user.currentBalance ?? 0
        case "franchise":
          return user.franchiseWallet ?? 0
        case "shaking":
          return user.shakingWallet ?? 0
        default:
          return 0
      }
    }

    const fromBalance = getWalletBalance(fromWallet)
    if (fromBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient ${fromWallet} wallet balance. Available: $${fromBalance}` },
        { status: 400 },
      )
    }

    // Update wallet balances
    const updateData: Partial<User> = {}
    const incData: Partial<Record<"normalWallet" | "franchiseWallet" | "shakingWallet" | "currentBalance", number>> = {}

    if (fromWallet === "normal") {
      incData.normalWallet = -amount
    } else if (fromWallet === "franchise") {
      incData.franchiseWallet = -amount
    } else if (fromWallet === "shaking") {
      incData.shakingWallet = -amount
    }

    if (toWallet === "normal") {
      incData.normalWallet = amount
    } else if (toWallet === "franchise") {
      incData.franchiseWallet = amount
    } else if (toWallet === "shaking") {
      incData.shakingWallet = amount
    }

    // Handle legacy currentBalance migration
    if (fromWallet === "normal" && user.currentBalance && !user.normalWallet) {
      updateData.normalWallet = user.currentBalance - amount
    }
    if (toWallet === "normal" && user.currentBalance && !user.normalWallet) {
      updateData.normalWallet = (user.currentBalance || 0) + amount
    }

    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $inc: incData,
        $set: updateData,
      },
    )

    // Create transfer transaction
    const transferTransaction: Transaction<TransferMeta> = {
      userId: user._id!.toString(),
      type: "transfer",
      amount: amount,
      currency: "USD",
      createdAt: new Date(),
      meta: {
        fromWallet: fromWallet as "normal" | "franchise" | "shaking",
        toWallet: toWallet as "normal" | "franchise" | "shaking",
        transferType: isAdminUser ? "admin" : "user",
        note: `Transfer: $${amount} from ${fromWallet} to ${toWallet}`,
      },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    return NextResponse.json({
      message: "Transfer completed successfully",
      fromWallet,
      toWallet,
      amount,
    })
  } catch (error) {
    console.error("Wallet transfer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

