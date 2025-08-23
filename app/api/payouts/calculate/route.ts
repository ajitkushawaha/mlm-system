import { type NextRequest, NextResponse } from "next/server"
import { PayoutCalculator } from "@/lib/payout-calculator"
import { verifyToken } from "@/lib/auth"
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

    const calculator = new PayoutCalculator()
    const userId = new ObjectId(decoded.userId)

    // Calculate potential payout for user
    const greenPayout = await calculator.calculateGreenPayout(userId)
    const bluePayout = await calculator.calculateBluePayout(userId)

    return NextResponse.json({
      greenPayout,
      bluePayout,
      message: "Payout calculation completed",
    })
  } catch (error) {
    console.error("Payout calculation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
