import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
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

    const db = await getDatabase()
    const users = await db
      .collection<User>("users")
      .find({})
      .project({
        _id: 1,
        name: 1,
        email: 1,
        normalWallet: 1,
        franchiseWallet: 1,
        shakingWallet: 1,
        currentBalance: 1,
      })
      .toArray()

    return NextResponse.json({
      users: users.map((u) => ({
        _id: u._id?.toString(),
        name: u.name,
        email: u.email,
        normalWallet: u.normalWallet ?? u.currentBalance ?? 0,
        franchiseWallet: u.franchiseWallet ?? 0,
        shakingWallet: u.shakingWallet ?? 0,
        currentBalance: u.currentBalance ?? 0,
      })),
    })
  } catch (error) {
    console.error("Get wallets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

