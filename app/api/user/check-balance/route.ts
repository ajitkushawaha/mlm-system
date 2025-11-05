import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Find user by userId (DS123456 format) or ObjectId
    let user: User | null = null
    
    // Try to find by userId first (DS123456)
    user = await db.collection<User>("users").findOne({ userId })
    
    // If not found, try ObjectId
    if (!user && ObjectId.isValid(userId)) {
      user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return only balance info (no sensitive data)
    return NextResponse.json({
      userId: user.userId,
      name: user.name,
      normalWallet: user.normalWallet || user.currentBalance || 0,
      isActive: user.isActive,
    })
  } catch (error) {
    console.error("Check balance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

