import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sponsorCode = searchParams.get("sponsorCode")

    if (!sponsorCode) {
      return NextResponse.json({ error: "Sponsor code is required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Try to find by User ID first (DS123456 format)
    let sponsor = await db.collection<User>("users").findOne({ userId: sponsorCode.toUpperCase() })
    
    // If not found by User ID, try ObjectId
    if (!sponsor && ObjectId.isValid(sponsorCode)) {
      sponsor = await db.collection<User>("users").findOne({ _id: new ObjectId(sponsorCode) })
    }

    if (!sponsor) {
      return NextResponse.json({ error: "Invalid sponsor code" }, { status: 404 })
    }

    return NextResponse.json({
      isValid: true,
      isFranchise: sponsor.role === "franchise",
      sponsorName: sponsor.name,
      sponsorUserId: sponsor.userId,
    })
  } catch (error) {
    console.error("Check sponsor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

