import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { type Db, ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

interface TreeNode {
  id: string
  name: string
  email: string
  membershipLevel: "green" | "blue" | "gold"
  isActive: boolean
  joinDate: string
  totalEarnings: number
  leftChild?: TreeNode
  rightChild?: TreeNode
  position?: "left" | "right"
  depth: number
}

async function buildTree(userId: ObjectId, db: Db, depth = 0, maxDepth = 3): Promise<TreeNode | null> {
  if (depth > maxDepth) return null

  const user = await db.collection<User>("users").findOne({ _id: userId })
  if (!user) return null

  const node: TreeNode = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    membershipLevel: user.membershipLevel,
    isActive: user.isActive,
    joinDate: user.joinDate.toISOString(),
    totalEarnings: user.totalEarnings,
    depth,
  }

  // Recursively build left and right subtrees
  if (user.leftChild) {
    const leftNode = await buildTree(user.leftChild, db, depth + 1, maxDepth)
    if (leftNode) {
      leftNode.position = "left"
      node.leftChild = leftNode
    }
  }

  if (user.rightChild) {
    const rightNode = await buildTree(user.rightChild, db, depth + 1, maxDepth)
    if (rightNode) {
      rightNode.position = "right"
      node.rightChild = rightNode
    }
  }

  return node
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
    const tree = await buildTree(new ObjectId(decoded.userId), db)

    if (!tree) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ tree })
  } catch (error) {
    console.error("Tree fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
