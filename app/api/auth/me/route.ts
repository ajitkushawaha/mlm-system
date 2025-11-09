import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
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

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || "user",
        membershipLevel: user.membershipLevel,
        isActive: user.isActive,
        boosterActive: user.boosterActive,
        boosterDeadline: user.boosterDeadline,
        totalEarnings: user.totalEarnings,
        currentBalance: user.currentBalance,
        normalWallet: user.normalWallet ?? user.currentBalance ?? 0,
        franchiseWallet: user.franchiseWallet ?? 0,
        shakingWallet: user.shakingWallet ?? 0,
        leftDirects: user.leftDirects,
        rightDirects: user.rightDirects,
        greenPayouts: user.greenPayouts,
        blueStep: user.blueStep,
        franchiseStatus: user.franchiseStatus,
        savedBankDetails: user.savedBankDetails,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
