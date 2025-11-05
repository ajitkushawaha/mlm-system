import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

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

    const db = await getDatabase()
    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $unset: {
          savedBankDetails: "",
        },
      },
    )

    return NextResponse.json({
      message: "Saved bank details cleared successfully",
    })
  } catch (error) {
    console.error("Clear saved details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

