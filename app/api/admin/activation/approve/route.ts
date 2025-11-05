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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Check if user has activation payment proof
      if (!user.activationPaymentProof) {
        return NextResponse.json({ error: "User has no activation payment proof" }, { status: 400 })
      }

      // Find the Franchise Member who referred this user
      if (!user.activatedBy) {
        return NextResponse.json({ error: "No Franchise Member assigned to activate this user" }, { status: 400 })
      }

      const franchiseMember = await db.collection<User>("users").findOne({ _id: user.activatedBy })

      if (!franchiseMember || franchiseMember.role !== "franchise") {
        return NextResponse.json({ error: "Franchise Member not found or invalid" }, { status: 404 })
      }

      // Check if Franchise Member has sufficient balance in franchiseWallet
      const activationFee = 10
      if ((franchiseMember.franchiseWallet || 0) < activationFee) {
        return NextResponse.json(
          {
            error: `Franchise Member has insufficient balance. Required: $${activationFee}, Available: $${franchiseMember.franchiseWallet || 0}`,
          },
          { status: 400 },
        )
      }

      // Deduct $10 from Franchise Member's franchiseWallet
      await db.collection<User>("users").updateOne(
        { _id: franchiseMember._id },
        {
          $inc: { franchiseWallet: -activationFee },
        },
      )

      // Activate the user
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        {
          $set: {
            isActive: true,
            activationStatus: "approved",
            activationDate: new Date(),
          },
        },
      )

      return NextResponse.json({
        message: "User activated successfully",
      })
    } else if (action === "reject") {
      // Reject activation
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        {
          $set: {
            activationStatus: "rejected",
          },
        },
      )

      return NextResponse.json({ message: "Activation rejected" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Activation approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status") || "pending"
    const status = statusParam as "pending" | "approved" | "rejected"

    const activations = await db
      .collection<User>("users")
      .find({
        activationStatus: status,
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        activationStatus: 1,
        activationPaymentProof: 1,
        activatedBy: 1,
        isActive: 1,
        sponsorId: 1,
      })
      .toArray()

    // Get Franchise Member details for each activation
    const activationsWithSponsor = await Promise.all(
      activations.map(async (activation) => {
        if (activation.activatedBy) {
          const franchiseMember = await db.collection<User>("users").findOne(
            { _id: activation.activatedBy },
            { projection: { name: 1, email: 1, franchiseWallet: 1 } },
          )
          return {
            ...activation,
            franchiseMember: franchiseMember || null,
          }
        }
        return { ...activation, franchiseMember: null }
      }),
    )

    return NextResponse.json({ activations: activationsWithSponsor })
  } catch (error) {
    console.error("Get activation requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

