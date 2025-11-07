import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import type { FranchiseApplication } from "@/lib/models/FranchiseApplication"
import type { User } from "@/lib/models/User"
import { ObjectId } from "mongodb"

async function isAdmin(userId: string): Promise<boolean> {
  const db = await getDatabase()
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })
  return user?.role === "admin"
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const searchTerm = searchParams.get("search")

    const db = await getDatabase()
    const query: { status?: "pending" | "approved" | "rejected"; $or?: Array<Record<string, { $regex: string; $options: string }>> } = {}

    if (status && status !== "all" && (status === "pending" || status === "approved" || status === "rejected")) {
      query.status = status
    }

    if (searchTerm) {
      query.$or = [
        { userName: { $regex: searchTerm, $options: "i" } },
        { userEmail: { $regex: searchTerm, $options: "i" } },
        { userIdString: { $regex: searchTerm, $options: "i" } },
        { transactionHash: { $regex: searchTerm, $options: "i" } },
      ]
    }

    const applications = await db
      .collection<FranchiseApplication>("franchiseApplications")
      .find(query)
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Fetch franchise applications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

