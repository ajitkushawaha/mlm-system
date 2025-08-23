import { type NextRequest, NextResponse } from "next/server"
import { PayoutCalculator } from "@/lib/payout-calculator"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/User"
import { ObjectId } from "mongodb"

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

    // Check if user is admin (you can implement admin role checking here)
    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For now, allow any user to run payout cycle (in production, restrict to admins)
    const calculator = new PayoutCalculator()
    const result = await calculator.runPayoutCycle()

    return NextResponse.json({
      message: "Payout cycle completed",
      processed: result.processed,
      totalAmount: result.totalAmount,
    })
  } catch (error) {
    console.error("Payout cycle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
