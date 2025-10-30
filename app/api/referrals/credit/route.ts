import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { recordGenerationCommission } from "@/lib/mlmLogic"

type CreditBody = {
  purchaserUserId: string
  packageAmount: number
  directReferrerUserId: string
}

export async function POST(request: NextRequest) {
  try {
    const { purchaserUserId, packageAmount, directReferrerUserId } = (await request.json()) as CreditBody

    if (!purchaserUserId || !directReferrerUserId || !packageAmount || packageAmount <= 0) {
      return NextResponse.json({ error: "purchaserUserId, directReferrerUserId and positive packageAmount are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Level-1 generation commission (fixed) when someone joins via referral and buys a package
    const txn = await recordGenerationCommission(
      directReferrerUserId,
      1,
      packageAmount,
      purchaserUserId,
      "USD",
      db,
    )

    // Add the commission to referrer's currentBalance
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(directReferrerUserId) }, { $inc: { currentBalance: txn.amount, totalEarnings: txn.amount } })

    return NextResponse.json({ message: "Commission credited", transaction: txn })
  } catch (error) {
    console.error("Referral credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


