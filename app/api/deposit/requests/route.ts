import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { DepositRequest } from "@/lib/models/DepositRequest"

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
      .collection<DepositRequest>("depositRequests")
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({
      requests: requests.map((req) => ({
        _id: req._id?.toString(),
        amount: req.amount,
        status: req.status,
        requestedAt: req.requestedAt,
        transactionHash: req.transactionHash,
        processedAt: req.processedAt,
        rejectionReason: req.rejectionReason,
      })),
    })
  } catch (error) {
    console.error("Fetch deposit requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

