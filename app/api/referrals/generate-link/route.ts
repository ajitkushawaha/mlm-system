import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

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

    // Generate referral link using user ID
    const userId = decoded.userId
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const referralLink = `${baseUrl}/register?ref=${userId}`

    return NextResponse.json({
      referralLink,
      userId,
      message: "Referral link generated successfully",
    })
  } catch (error) {
    console.error("Referral link generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
