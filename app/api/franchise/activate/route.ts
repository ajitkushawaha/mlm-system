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
    const franchiseMember = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!franchiseMember) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only franchise members can activate users
    if (franchiseMember.role !== "franchise") {
      return NextResponse.json({ error: "Access denied. Only franchise members can activate users." }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get the user to activate
    const userToActivate = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!userToActivate) {
      return NextResponse.json({ error: "User to activate not found" }, { status: 404 })
    }

    // Check if user is already active
    if (userToActivate.isActive) {
      return NextResponse.json({ error: "User is already active" }, { status: 400 })
    }

    // Check if franchise member has sufficient balance
    const activationFee = 10
    const franchiseWallet = franchiseMember.franchiseWallet || 0

    if (franchiseWallet < activationFee) {
      return NextResponse.json(
        {
          error: `Insufficient Franchise Wallet balance. Required: $${activationFee}, Available: $${franchiseWallet.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Deduct $10 from franchise member's franchiseWallet
    await db.collection<User>("users").updateOne(
      { _id: franchiseMember._id },
      {
        $inc: { franchiseWallet: -activationFee },
      },
    )

    // Activate the user
    await db.collection<User>("users").updateOne(
      { _id: userToActivate._id },
      {
        $set: {
          isActive: true,
          activationStatus: "approved",
          activationDate: new Date(),
          activatedBy: franchiseMember._id,
        },
      },
    )

    // Create transfer transaction for franchise member
    const transferTransaction: Transaction<TransferMeta> = {
      userId: franchiseMember._id!.toString(),
      type: "transfer",
      amount: activationFee,
      currency: "USD",
      createdAt: new Date(),
        meta: {
          fromWallet: "franchise",
          toWallet: "normal", // Activation payment goes to system, but we use "normal" as placeholder
          transferType: "user",
          note: `User activation: ${userToActivate.name} (${userToActivate.email})`,
        },
    }

    await db.collection<Transaction>("transactions").insertOne(transferTransaction)

    // Distribute Generation Commission to upline when user is activated
    // Treat activation as a "join" event that triggers generation commission
    if (userToActivate.sponsorId) {
      try {
        // Import the generation commission distribution function
        const { recordGenerationCommission } = await import("@/lib/mlmLogic")
        
        // Get upline chain with generation levels (up to 5 levels)
        const uplineChain: Array<{ userId: ObjectId; generationLevel: number }> = []
        let currentUserId: ObjectId | undefined = userToActivate._id
        let generationLevel = 1
        const maxLevel = 5

        while (currentUserId && generationLevel <= maxLevel) {
          const user: User | null = await db.collection<User>("users").findOne({ _id: currentUserId })
          if (!user || !user.sponsorId) break

          const sponsor: User | null = await db.collection<User>("users").findOne({ _id: user.sponsorId })
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
            activationFee, // Package amount (activation fee)
            userToActivate._id!.toString(),
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
      franchiseWalletBalance: franchiseWallet - activationFee,
    })
  } catch (error) {
    console.error("Activate user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

