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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const db = await getDatabase()

    const application = await db
      .collection<FranchiseApplication>("franchiseApplications")
      .findOne({ _id: new ObjectId(id) })

    if (!application) {
      return NextResponse.json({ error: "Franchise application not found" }, { status: 404 })
    }

    // Get user details
    const user = await db.collection<User>("users").findOne({ _id: application.userId })

    return NextResponse.json({
      application: {
        ...application,
        _id: application._id?.toString(),
        userId: application.userId.toString(),
        requestedAt: application.requestedAt.toISOString(),
        processedAt: application.processedAt?.toISOString(),
      },
      user: user
        ? {
            name: user.name,
            email: user.email,
            userId: user.userId,
            phone: user.phone,
          }
        : null,
    })
  } catch (error) {
    console.error("Fetch franchise application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

