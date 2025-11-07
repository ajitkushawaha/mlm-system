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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { userId, normalWallet, franchiseWallet, shakingWallet } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get current balances
    const currentNormal = user.normalWallet ?? user.currentBalance ?? 0
    const currentFranchise = user.franchiseWallet ?? 0
    const currentShaking = user.shakingWallet ?? 0

    // Calculate differences
    const normalDiff = (normalWallet ?? 0) - currentNormal
    const franchiseDiff = (franchiseWallet ?? 0) - currentFranchise
    const shakingDiff = (shakingWallet ?? 0) - currentShaking

    // Update wallets
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          normalWallet: normalWallet ?? 0,
          franchiseWallet: franchiseWallet ?? 0,
          shakingWallet: shakingWallet ?? 0,
          // Also update currentBalance for backward compatibility
          currentBalance: normalWallet ?? 0,
        },
      },
    )

    // Create transaction records for changes
    if (normalDiff !== 0) {
      const txn: Transaction<TransferMeta> = {
        userId: user._id!.toString(),
        type: "transfer",
        amount: Math.abs(normalDiff),
        currency: "USD",
        createdAt: new Date(),
        meta: {
          fromWallet: normalDiff > 0 ? "normal" : "normal", // Admin adjustment from normal
          toWallet: "normal",
          transferType: "admin",
          note: `Admin adjustment: ${normalDiff > 0 ? "+" : ""}$${normalDiff.toFixed(2)} to Main Wallet`,
        },
      }
      await db.collection<Transaction>("transactions").insertOne(txn)
    }

    if (franchiseDiff !== 0) {
      const txn: Transaction<TransferMeta> = {
        userId: user._id!.toString(),
        type: "transfer",
        amount: Math.abs(franchiseDiff),
        currency: "USD",
        createdAt: new Date(),
        meta: {
          fromWallet: franchiseDiff > 0 ? "franchise" : "franchise",
          toWallet: "franchise",
          transferType: "admin",
          note: `Admin adjustment: ${franchiseDiff > 0 ? "+" : ""}$${franchiseDiff.toFixed(2)} to Franchise Wallet`,
        },
      }
      await db.collection<Transaction>("transactions").insertOne(txn)
    }

    if (shakingDiff !== 0) {
      const txn: Transaction<TransferMeta> = {
        userId: user._id!.toString(),
        type: "transfer",
        amount: Math.abs(shakingDiff),
        currency: "USD",
        createdAt: new Date(),
        meta: {
          fromWallet: shakingDiff > 0 ? "staking" : "staking",
          toWallet: "staking",
          transferType: "admin",
          note: `Admin adjustment: ${shakingDiff > 0 ? "+" : ""}$${shakingDiff.toFixed(2)} to Staking Wallet`,
        },
      }
      await db.collection<Transaction>("transactions").insertOne(txn)
    }

    return NextResponse.json({
      message: "Wallets updated successfully",
      normalWallet,
      franchiseWallet,
      shakingWallet,
    })
  } catch (error) {
    console.error("Update wallets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

