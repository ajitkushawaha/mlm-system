import { NextResponse, type NextRequest } from "next/server"
import { ObjectId, type Db } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { recordGenerationCommission } from "@/lib/mlmLogic"
import type { User } from "@/lib/models/User"

type CreditBody = {
  purchaserUserId: string
  packageAmount: number
  directReferrerUserId: string
}

/**
 * Get upline chain and trace generation level for each upline
 * Generation level is based on how many direct referrals the upline has
 * 
 * Unlock Rules:
 * - Level 1: Need 1+ direct referrals → Can earn $3
 * - Level 2: Need 2+ direct referrals → Can earn $1
 * - Level 3: Need 3+ direct referrals → Can earn $0.80
 * - Level 4: Need 4+ direct referrals → Can earn $0.70
 * - Level 5: Need 5+ direct referrals → Can earn $0.60
 */
async function getUplineChainWithLevels(
  purchaserUserId: ObjectId,
  db: Db,
  maxLevel: number = 5,
): Promise<Array<{ userId: ObjectId; generationLevel: number }>> {
  const chain: Array<{ userId: ObjectId; generationLevel: number }> = []
  let currentUserId: ObjectId | undefined = purchaserUserId
  let generationLevel = 1

  while (currentUserId && generationLevel <= maxLevel) {
    const user: User | null = await db.collection<User>("users").findOne({ _id: currentUserId })
    if (!user || !user.sponsorId) break

    const sponsor: User | null = await db.collection<User>("users").findOne({ _id: user.sponsorId })
    if (!sponsor || !sponsor._id) break

    // Calculate sponsor's direct referrals count
    const directReferralsCount = (sponsor.leftDirects || 0) + (sponsor.rightDirects || 0)

    // Only add to chain if sponsor has enough direct referrals to unlock this generation level
    // Level 1 needs 1+ direct referrals, Level 2 needs 2+, etc.
    if (directReferralsCount >= generationLevel) {
      chain.push({
        userId: sponsor._id,
        generationLevel,
      })
    }

    currentUserId = sponsor._id
    generationLevel++
  }

  return chain
}

export async function POST(request: NextRequest) {
  try {
    const { purchaserUserId, packageAmount, directReferrerUserId } = (await request.json()) as CreditBody

    if (!purchaserUserId || !directReferrerUserId || !packageAmount || packageAmount <= 0) {
      return NextResponse.json(
        { error: "purchaserUserId, directReferrerUserId and positive packageAmount are required" },
        { status: 400 },
      )
    }

    const db = await getDatabase()

    // Get purchaser user to trace upline chain
    const purchaserUser = await db.collection<User>("users").findOne({ _id: new ObjectId(purchaserUserId) })
    if (!purchaserUser) {
      return NextResponse.json({ error: "Purchaser user not found" }, { status: 404 })
    }

    // Get upline chain with generation levels (only unlocked levels)
    const uplineChain = await getUplineChainWithLevels(purchaserUser._id!, db, 5)

    // Distribute generation commission to unlocked levels only
    let totalCommissions = 0
    const commissions: Array<{ level: number; amount: number; userId: string }> = []

    for (const upline of uplineChain) {
      const commission = await recordGenerationCommission(
        upline.userId.toString(),
        upline.generationLevel,
        packageAmount,
        purchaserUserId,
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

      totalCommissions += commission.amount
      commissions.push({
        level: upline.generationLevel,
        amount: commission.amount,
        userId: upline.userId.toString(),
      })
    }

    return NextResponse.json({
      message: "Generation commission distributed to unlocked levels",
      totalCommissions,
      commissionsDistributed: commissions.length,
      commissions,
    })
  } catch (error) {
    console.error("Referral credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


