import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { WithdrawalRequest } from "@/lib/models/WithdrawalRequest"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const requests = await db
      .collection<WithdrawalRequest>("withdrawalRequests")
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({
      requests: requests.map((req) => ({
        _id: req._id?.toString(),
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

