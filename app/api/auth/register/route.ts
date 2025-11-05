import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createUser } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    // All registrations use JSON (password auto-generated)
    // All registrations use JSON (no file uploads needed)
    const body = await request.json()
    const registrationData: {
      email: string
      name: string
      phone: string
      sponsorCode?: string
    } = body

    const { email, name, phone, sponsorCode } = registrationData

    // Validate required fields (password not needed - will be auto-generated)
    if (!email || !name || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 })
    }

    // Generate random 6-digit password
    const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString()

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Find sponsor if sponsor code provided
    // Sponsor code can be either ObjectId or User ID (DS123456)
    let sponsorId: ObjectId | undefined
    let sponsor: User | null = null

    if (sponsorCode) {
      // Try to find by User ID first (DS123456 format)
      sponsor = await db.collection<User>("users").findOne({ userId: sponsorCode.toUpperCase() })
      
      // If not found by User ID, try ObjectId
      if (!sponsor && ObjectId.isValid(sponsorCode)) {
        sponsor = await db.collection<User>("users").findOne({ _id: new ObjectId(sponsorCode) })
      }
      
      if (!sponsor) {
        return NextResponse.json({ error: "Invalid sponsor code" }, { status: 400 })
      }
      sponsorId = sponsor._id
    }

    // All new users start as inactive - only Franchise Members can activate them
    const isActive = false
    const activationStatus: "pending" | "approved" | "rejected" | undefined = undefined

    // Create new user with auto-generated password
    const newUser = await createUser({
      email,
      password: generatedPassword,
      name,
      phone,
      role: "user",
      sponsorId,
      membershipLevel: "green",
      isActive,
      activationPaymentProof: undefined,
      activationStatus,
      activatedBy: undefined,
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
            .updateOne({ _id: sponsorId }, { $set: { boosterActive: true, boosterDeadline: new Date() } })
        }
      }
    }

    // Get sponsor info for response
    let sponsorUserId: string | undefined
    if (sponsorId) {
      const sponsor = await db.collection<User>("users").findOne({ _id: sponsorId })
      sponsorUserId = sponsor?.userId
    }

    return NextResponse.json({
      message: "User created successfully",
      userId: newUser._id,
      userDetails: {
        userId: newUser.userId,
        name: newUser.name,
        password: generatedPassword, // Return auto-generated password for display
        sponsorId: sponsorUserId,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
