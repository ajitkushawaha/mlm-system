import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createUser } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, sponsorCode } = await request.json()

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Find sponsor if sponsor code provided
    let sponsorId: ObjectId | undefined
    if (sponsorCode) {
      const sponsor = await db.collection<User>("users").findOne({ _id: new ObjectId(sponsorCode) })
      if (!sponsor) {
        return NextResponse.json({ error: "Invalid sponsor code" }, { status: 400 })
      }
      sponsorId = sponsor._id
    }

    // Create new user
    const newUser = await createUser({
      email,
      password,
      name,
      phone,
      sponsorId,
      membershipLevel: "green",
      isActive: true,
    })

    // If there's a sponsor, add this user to their binary tree
    if (sponsorId) {
      const sponsor = await db.collection<User>("users").findOne({ _id: sponsorId })
      if (sponsor) {
        // Place in left if empty, otherwise right
        if (!sponsor.leftChild) {
          await db.collection<User>("users").updateOne(
            { _id: sponsorId },
            {
              $set: { leftChild: newUser._id },
              $inc: { leftDirects: 1 },
            },
          )
        } else if (!sponsor.rightChild) {
          await db.collection<User>("users").updateOne(
            { _id: sponsorId },
            {
              $set: { rightChild: newUser._id },
              $inc: { rightDirects: 1 },
            },
          )
        }

        // Check if sponsor completed booster requirement
        const updatedSponsor = await db.collection<User>("users").findOne({ _id: sponsorId })
        if (updatedSponsor && updatedSponsor.leftDirects >= 1 && updatedSponsor.rightDirects >= 1) {
          await db
            .collection<User>("users")
            .updateOne({ _id: sponsorId }, { $set: { boosterActive: true, boosterDeadline: null } })
        }
      }
    }

    return NextResponse.json({
      message: "User created successfully",
      userId: newUser._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
