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
    const requests = await db
      .collection<WithdrawalRequest>("withdrawalRequests")
      .find({})
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({
      requests: requests.map((req) => ({
        _id: req._id?.toString(),
        userId: req.userId.toString(),
        userName: req.userName,
        userEmail: req.userEmail,
        amount: req.amount,
        status: req.status,
        requestedAt: req.requestedAt,
        processedAt: req.processedAt,
        rejectionReason: req.rejectionReason,
        bankName: req.bankName,
        accountNumber: req.accountNumber,
        accountHolderName: req.accountHolderName,
        ifscCode: req.ifscCode,
        branchName: req.branchName,
        bankPassbookImage: req.bankPassbookImage,
      })),
    })
  } catch (error) {
    console.error("Get withdrawal requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

