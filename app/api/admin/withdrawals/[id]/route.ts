import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { WithdrawalRequest } from "@/lib/models/WithdrawalRequest"

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
    const { id } = await params
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = await getDatabase()
    const withdrawalRequest = await db
      .collection<WithdrawalRequest>("withdrawalRequests")
      .findOne({ _id: new ObjectId(id) })

    if (!withdrawalRequest) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 })
    }

    return NextResponse.json({
      request: {
        _id: withdrawalRequest._id?.toString(),
        userId: withdrawalRequest.userId.toString(),
        userName: withdrawalRequest.userName,
        userEmail: withdrawalRequest.userEmail,
        amount: withdrawalRequest.amount,
        status: withdrawalRequest.status,
        requestedAt: withdrawalRequest.requestedAt,
        processedAt: withdrawalRequest.processedAt,
        rejectionReason: withdrawalRequest.rejectionReason,
        bankName: withdrawalRequest.bankName,
        accountNumber: withdrawalRequest.accountNumber,
        accountHolderName: withdrawalRequest.accountHolderName,
        ifscCode: withdrawalRequest.ifscCode,
        branchName: withdrawalRequest.branchName,
        bankPassbookImage: withdrawalRequest.bankPassbookImage,
      },
    })
  } catch (error) {
    console.error("Get withdrawal request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

