import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

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

    // Get user's userId (DS123456 format) instead of ObjectId
    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Use userId (DS123456) if available, otherwise fallback to ObjectId
    const referralCode = user.userId || decoded.userId
    
    // Use production URL for referral links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.dreamstake.in"
    const referralLink = `${baseUrl}/register?ref=${referralCode}`

    return NextResponse.json({
      referralLink,
      userId: referralCode,
      message: "Referral link generated successfully",
    })
  } catch (error) {
    console.error("Referral link generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
