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
    const currentUser = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only franchise members and admins can search
    if (currentUser.role !== "franchise" && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Only franchise members can activate users." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    // Search for inactive users by email, phone, user ID (DS123456), or ObjectId
    const searchQuery: {
      isActive: boolean
      role: { $ne: "admin" }
      $or?: Array<Record<string, unknown>>
    } = {
      isActive: false,
      role: { $ne: "admin" }, // Exclude admins
    }

    // If query is provided, add search conditions
    if (query && query.length > 0) {
      // Build search conditions
      const searchConditions: Array<Record<string, unknown>> = [
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ]

      // Add userId search (DS123456 format) - exact match
      const upperQuery = query.toUpperCase()
      if (upperQuery.startsWith("DS")) {
        searchConditions.push({ userId: upperQuery })
      } else {
        // Also try partial match for userId
        searchConditions.push({ userId: { $regex: upperQuery, $options: "i" } })
      }

      // Try to match as ObjectId if valid
      if (ObjectId.isValid(query)) {
        searchConditions.push({ _id: new ObjectId(query) })
      }

      searchQuery.$or = searchConditions
    }
    // If no query, return all inactive users

    const inactiveUsers = await db
      .collection<User>("users")
      .find(searchQuery, {
        projection: {
          _id: 1,
          userId: 1,
          name: 1,
          email: 1,
          phone: 1,
          joinDate: 1,
          sponsorId: 1,
          isActive: 1,
        },
      })
      .limit(20)
      .toArray()

    return NextResponse.json({
      users: inactiveUsers.map((user) => ({
        _id: user._id!.toString(),
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        joinDate: user.joinDate,
        sponsorId: user.sponsorId?.toString(),
        isActive: user.isActive,
      })),
    })
  } catch (error) {
    console.error("Search inactive users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

