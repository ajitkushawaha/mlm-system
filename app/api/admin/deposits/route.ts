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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !(await isAdmin(decoded.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const db = await getDatabase()
    const url = new URL(request.url)
    const status = url.searchParams.get("status")

    const query: { status?: "pending" | "approved" | "rejected" } = {}
    if (status && status !== "all" && (status === "pending" || status === "approved" || status === "rejected")) {
      query.status = status
    }

    const requests = await db
      .collection<DepositRequest>("depositRequests")
      .find(query)
      .sort({ requestedAt: -1 })
      .toArray()

    return NextResponse.json({
      requests: requests.map((req) => ({
        _id: req._id?.toString(),
        userId: req.userId.toString(),
        userName: req.userName,
        userEmail: req.userEmail,
        userIdString: req.userIdString,
        amount: req.amount,
        status: req.status,
        requestedAt: req.requestedAt,
        processedAt: req.processedAt,
        processedBy: req.processedBy?.toString(),
        rejectionReason: req.rejectionReason,
        transactionHash: req.transactionHash,
        proofImage: req.proofImage,
        notes: req.notes,
        network: req.network,
        currency: req.currency,
      })),
    })
  } catch (error) {
    console.error("Fetch deposits error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

