import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { type Db, ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

interface ReferralTreeNode {
  id: string
  name: string
  email: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
  position: "left" | "right"
  level: number
  children: ReferralTreeNode[]
}

async function buildReferralTree(userId: ObjectId, db: Db, level = 1, maxLevel = 5): Promise<ReferralTreeNode[]> {
  if (level > maxLevel) return []

  const directReferrals = await db.collection<User>("users").find({ sponsorId: userId }).sort({ joinDate: 1 }).toArray()

  const tree: ReferralTreeNode[] = []

  for (let i = 0; i < directReferrals.length; i++) {
    const referral = directReferrals[i]
    const position = i === 0 ? "left" : "right"

    const node: ReferralTreeNode = {
      id: referral._id!.toString(),
      name: referral.name,
      email: referral.email,
      membershipLevel: referral.membershipLevel,
      isActive: referral.isActive,
      joinDate: referral.joinDate.toISOString(),
      totalEarnings: referral.totalEarnings,
      position,
      level,
      children: await buildReferralTree(referral._id!, db, level + 1, maxLevel),
    }

    tree.push(node)
  }

  return tree
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
    const userId = new ObjectId(decoded.userId)

    const tree = await buildReferralTree(userId, db)

    return NextResponse.json({ tree })
  } catch (error) {
    console.error("Referral tree error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
