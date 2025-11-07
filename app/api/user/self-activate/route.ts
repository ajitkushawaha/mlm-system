import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { Transaction, TransferMeta } from "@/lib/models/Transaction"

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const body = await request.json().catch(() => ({}))
    const { userId, password } = body

    let user: User | null = null

    // Try to authenticate first (if token exists)
    const token = request.cookies.get("auth-token")?.value
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })
      }
    }

    // If no token or user not found, try userId/password authentication
    if (!user && userId && password) {
      // Find user by userId (DS123456 format) or ObjectId
      user = await db.collection<User>("users").findOne({ userId })
      if (!user && ObjectId.isValid(userId)) {
        user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
      }

      if (user) {
        // Verify password
        const { verifyPassword } = await import("@/lib/auth")
        const isValidPassword = await verifyPassword(password, user.password)
        if (!isValidPassword) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found or not authenticated" }, { status: 404 })
    }

    // Check if user is already active
    if (user.isActive) {
      return NextResponse.json({ error: "User is already active" }, { status: 400 })
    }

    const activationFee = 10
    const normalWallet = user.normalWallet || user.currentBalance || 0

    // Check if user has sufficient balance
    if (normalWallet < activationFee) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: $${activationFee}, Available: $${normalWallet.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Deduct $10 from Main wallet
    await db.collection<User>("users").updateOne(
      { _id: user._id },
      {
        $inc: {
          normalWallet: -activationFee,
          currentBalance: -activationFee,
        },
        $set: {
          isActive: true,
          activationStatus: "approved",
          activationDate: new Date(),
        },
      },
    )

    // Create transfer transaction
    const transferTransaction: Transaction<TransferMeta> = {
      userId: user._id!.toString(),
      type: "transfer",
      amount: activationFee,
      currency: "USD",
      createdAt: new Date(),
      meta: {
        fromWallet: "normal",
          toWallet: "normal", // Self-activation payment goes to system, but we use "normal" as placeholder
        transferType: "user",
        note: `Self-activation: User activated themselves`,
      },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    // Distribute Generation Commission to upline when user self-activates
    if (user.sponsorId) {
      try {
        const { recordGenerationCommission } = await import("@/lib/mlmLogic")

        // Get upline chain with generation levels (up to 5 levels)
        const uplineChain: Array<{ userId: ObjectId; generationLevel: number }> = []
        let currentUserId: ObjectId | undefined = user._id
        let generationLevel = 1
        const maxLevel = 5

        while (currentUserId && generationLevel <= maxLevel) {
          const currentUser: User | null = await db.collection<User>("users").findOne({ _id: currentUserId })
          if (!currentUser || !currentUser.sponsorId) break

          const sponsor: User | null = await db.collection<User>("users").findOne({ _id: currentUser.sponsorId })
          if (!sponsor || !sponsor._id) break

          // Calculate sponsor's direct referrals count for unlock check
          const directReferralsCount = (sponsor.leftDirects || 0) + (sponsor.rightDirects || 0)

          // Only add to chain if sponsor has enough direct referrals to unlock this generation level
          if (directReferralsCount >= generationLevel) {
            uplineChain.push({
              userId: sponsor._id,
              generationLevel,
            })
          }

          currentUserId = sponsor._id
          generationLevel++
        }

        // Distribute generation commission to each upline
        for (const upline of uplineChain) {
          const commission = await recordGenerationCommission(
            upline.userId.toString(),
            upline.generationLevel,
            activationFee,
            user._id!.toString(),
            "USD",
            db,
          )

          // Credit commission to upline's normalWallet
          await db.collection<User>("users").updateOne(
            { _id: upline.userId },
            {
              $inc: {
                normalWallet: commission.amount,
                currentBalance: commission.amount,
                totalEarnings: commission.amount,
              },
            },
          )
        }
      } catch (error) {
        console.error("Generation commission distribution error:", error)
        // Don't fail activation if commission distribution fails
      }
    }

    return NextResponse.json({
      message: "User activated successfully",
      normalWalletBalance: normalWallet - activationFee,
    })
  } catch (error) {
    console.error("Self-activation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

