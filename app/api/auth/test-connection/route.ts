import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/User"

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Try to find admin user
    const admin = await db.collection<User>("users").findOne({ email: "admin@dreamstake.com" })
    
    // Count all users
    const userCount = await db.collection<User>("users").countDocuments()
    
    // Find all admin users
    const allAdmins = await db.collection<User>("users")
      .find({ role: "admin" })
      .project({ email: 1, role: 1, isActive: 1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      database: "mlm_system",
      mongodbUri: process.env.MONGODB_URI ? "Set ✅" : "Not set ❌",
      adminFound: admin ? "✅ YES" : "❌ NO",
      adminEmail: admin?.email || "Not found",
      adminRole: admin?.role || "Not found",
      adminActive: admin?.isActive,
      totalUsers: userCount,
      allAdmins: allAdmins.map(a => ({
        email: a.email,
        role: a.role,
        isActive: a.isActive,
      })),
    })
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      mongodbUri: process.env.MONGODB_URI ? "Set ✅" : "Not set ❌",
    }, { status: 500 })
  }
}

