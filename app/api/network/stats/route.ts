import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { type Db, ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

async function getNetworkStats(userId: ObjectId, db: Db) {
  const user = await db.collection<User>("users").findOne({ _id: userId })
  if (!user) return null

  // Count total network size recursively
  async function countNetwork(nodeId: ObjectId, visited = new Set()): Promise<number> {
    if (visited.has(nodeId.toString())) return 0
    visited.add(nodeId.toString())

    const node = await db.collection<User>("users").findOne({ _id: nodeId })
    if (!node) return 0

    let count = 1 // Count current node

    if (node.leftChild) {
      count += await countNetwork(node.leftChild, visited)
    }
    if (node.rightChild) {
      count += await countNetwork(node.rightChild, visited)
    }

    return count
  }

  // Count left and right leg sizes
  async function countLegSize(nodeId: ObjectId | undefined): Promise<number> {
    if (!nodeId) return 0
    return await countNetwork(nodeId, new Set())
  }

  const leftLegSize = await countLegSize(user.leftChild)
  const rightLegSize = await countLegSize(user.rightChild)
  const totalNetworkSize = leftLegSize + rightLegSize

  // Calculate potential pairs
  const potentialPairs = Math.min(leftLegSize, rightLegSize)

  return {
    totalNetworkSize,
    leftLegSize,
    rightLegSize,
    potentialPairs,
    directReferrals: user.leftDirects + user.rightDirects,
    balanceRatio: rightLegSize > 0 ? leftLegSize / rightLegSize : leftLegSize > 0 ? Number.POSITIVE_INFINITY : 1,
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
    const stats = await getNetworkStats(new ObjectId(decoded.userId), db)

    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Network stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
