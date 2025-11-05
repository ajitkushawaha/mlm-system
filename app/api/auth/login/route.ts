import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyPassword, generateToken } from "@/lib/auth"
import type { User } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, userId, password } = await request.json()

    if (!password || (!email && !userId)) {
      return NextResponse.json({ error: "Email/User ID and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    
    let user: User | null = null

    // Admin login: Use email
    // Regular users: Use User ID (format: DS123456)
    if (email) {
      // Admin login with email
      user = await db.collection<User>("users").findOne({ email })
      if (!user) {
        user = await db.collection<User>("users").findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
        })
      }
    } else if (userId) {
      // Regular user login with User ID
      user = await db.collection<User>("users").findOne({ userId })
    }
    
    if (!user) {
      console.error("Login failed: User not found", { email, userId, dbName: db.databaseName })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is active (unless admin)
    if (!user.isActive && user.role !== "admin") {
      console.error("Login failed: User not active", { email, isActive: user.isActive })
      return NextResponse.json(
        {
          error: "Account is not active. Please contact a Franchise Member to activate your account before you can login.",
        },
        { status: 401 },
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      console.error("Login failed: Invalid password", { email })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Update last activity
    await db.collection<User>("users").updateOne({ _id: user._id }, { $set: { lastActivity: new Date() } })

    const token = generateToken(user._id!.toString())

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        membershipLevel: user.membershipLevel,
        isActive: user.isActive,
        role: user.role,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
