import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId, type Filter } from "mongodb"
import type { User } from "@/lib/models/User"

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const level = searchParams.get("level") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit
    const db = await getDatabase()

    // Build filter query
    const filter: Filter<User> = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ]
    }
    if (level) filter.membershipLevel = level
    if (status === "active") filter.isActive = true
    if (status === "inactive") filter.isActive = false

    // Get users with pagination
    const users = await db
      .collection<User>("users")
      .find(filter, { projection: { password: 0 } })
      .sort({ joinDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalCount = await db.collection<User>("users").countDocuments(filter)

    // Get summary statistics
    const stats = await db
      .collection<User>("users")
      .aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
            greenUsers: { $sum: { $cond: [{ $eq: ["$membershipLevel", "green"] }, 1, 0] } },
            blueUsers: { $sum: { $cond: [{ $eq: ["$membershipLevel", "blue"] }, 1, 0] } },
            goldUsers: { $sum: { $cond: [{ $eq: ["$membershipLevel", "gold"] }, 1, 0] } },
            totalEarnings: { $sum: "$totalEarnings" },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        greenUsers: 0,
        blueUsers: 0,
        goldUsers: 0,
        totalEarnings: 0,
      },
    })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { userId, action, data } = await request.json()
    const db = await getDatabase()

    switch (action) {
      case "toggle-status":
        await db
          .collection<User>("users")
          .updateOne({ _id: new ObjectId(userId) }, { $set: { isActive: data.isActive } })
        break

      case "update-level":
        await db
          .collection<User>("users")
          .updateOne({ _id: new ObjectId(userId) }, { $set: { membershipLevel: data.membershipLevel } })
        break

      case "reset-booster":
        await db
          .collection<User>("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $set: { boosterActive: true, boosterDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) } },
          )
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
