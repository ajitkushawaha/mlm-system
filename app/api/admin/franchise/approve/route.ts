import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { Transaction, FranchiseMeta } from "@/lib/models/Transaction"

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

    const { userId, action, franchiseWalletCredit } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Update user to franchise member
      const updateData: Partial<User> = {
        role: "franchise",
        franchiseStatus: "approved",
      }

      // Add initial franchise wallet credit if provided
      if (franchiseWalletCredit && franchiseWalletCredit > 0) {
        updateData.franchiseWallet = (user.franchiseWallet || 0) + franchiseWalletCredit
      } else {
        updateData.franchiseWallet = user.franchiseWallet || 0
      }

      await db.collection<User>("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

      // Create franchise transaction record
      const franchiseTransaction: Transaction<FranchiseMeta> = {
        userId: userId,
        type: "franchise",
        amount: 100, // Franchise fee
        currency: "USD",
        createdAt: new Date(),
        meta: {
          franchiseFee: 100,
          franchiseWalletCredit: franchiseWalletCredit || 0,
        },
      }

      await db.collection<Transaction>("transactions").insertOne(franchiseTransaction)

      return NextResponse.json({
        message: "Franchise application approved successfully",
        franchiseWalletCredit: updateData.franchiseWallet,
      })
    } else if (action === "reject") {
      // Reject franchise application
      await db.collection<User>("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            franchiseStatus: "rejected",
          },
        },
      )

      return NextResponse.json({ message: "Franchise application rejected" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Franchise approval error:", error)
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

    const applications = await db
      .collection<User>("users")
      .find({
        franchiseStatus: status,
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        franchiseStatus: 1,
        franchisePaymentProof: 1,
        franchisePurchaseDate: 1,
        role: 1,
      })
      .toArray()

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Get franchise applications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

