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

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a franchise member or admin
    if (user.role === "franchise" || user.role === "admin") {
      return NextResponse.json({ error: "You are already a franchise member or admin" }, { status: 400 })
    }

    // Check if user already has a pending application
    if (user.franchiseStatus === "pending") {
      return NextResponse.json({ error: "You already have a pending franchise application" }, { status: 400 })
    }

    const { selfActivate } = await request.json().catch(() => ({ selfActivate: false }))
    const franchiseFee = 100
    const normalWallet = user.normalWallet || user.currentBalance || 0

    // If user wants to self-activate and has sufficient balance
    if (selfActivate && normalWallet >= franchiseFee) {
      // Deduct $100 from normal wallet
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        {
          $inc: {
            normalWallet: -franchiseFee,
            currentBalance: -franchiseFee,
          },
          $set: {
            role: "franchise",
            franchiseStatus: "approved",
            franchisePurchaseDate: new Date(),
            franchiseWallet: (user.franchiseWallet || 0) + franchiseFee, // Credit to franchise wallet
          },
        },
      )

      // Create transfer transaction
      const transferTransaction: Transaction<TransferMeta> = {
        userId: user._id!.toString(),
        type: "transfer",
        amount: franchiseFee,
        currency: "USD",
        createdAt: new Date(),
        meta: {
          fromWallet: "normal",
          toWallet: "franchise",
          transferType: "user",
          note: `Self-activation: Franchise membership purchased`,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(transferTransaction)

      return NextResponse.json({
        message: "Franchise membership activated successfully",
        status: "approved",
        franchiseWalletBalance: (user.franchiseWallet || 0) + franchiseFee,
      })
    }

    // Otherwise, just send request to admin
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $set: {
          franchiseStatus: "pending",
          franchisePurchaseDate: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: "Franchise application submitted successfully",
      status: "pending",
    })
  } catch (error) {
    console.error("Franchise application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

