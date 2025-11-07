import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { DepositRequest } from "@/lib/models/DepositRequest"

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
    const depositRequest = await db
      .collection<DepositRequest>("depositRequests")
      .findOne({ _id: new ObjectId(id) })

    if (!depositRequest) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 })
    }

    return NextResponse.json({
      request: {
        _id: depositRequest._id?.toString(),
        userId: depositRequest.userId.toString(),
        userName: depositRequest.userName,
        userEmail: depositRequest.userEmail,
        userIdString: depositRequest.userIdString,
        amount: depositRequest.amount,
        status: depositRequest.status,
        requestedAt: depositRequest.requestedAt,
        processedAt: depositRequest.processedAt,
        processedBy: depositRequest.processedBy?.toString(),
        rejectionReason: depositRequest.rejectionReason,
        transactionHash: depositRequest.transactionHash,
        proofImage: depositRequest.proofImage,
        notes: depositRequest.notes,
        network: depositRequest.network,
        currency: depositRequest.currency,
      },
    })
  } catch (error) {
    console.error("Fetch deposit request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

