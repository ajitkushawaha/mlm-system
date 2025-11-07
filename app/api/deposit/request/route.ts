import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import type { DepositRequest } from "@/lib/models/DepositRequest"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const amount = parseFloat(body.amount)

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid deposit amount is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const transactionHash = body.transactionHash as string | undefined
    const notes = body.notes as string | undefined
    const network = body.network || "BEP20"
    const proofImage = body.proofImage as string | undefined // Base64 string

    // Validate: Either transaction hash OR proof image required
    if (!transactionHash && (!proofImage || proofImage.trim() === "")) {
      return NextResponse.json(
        { error: "Please provide either transaction hash or proof image" },
        { status: 400 },
      )
    }

    // Validate base64 string format if provided
    if (proofImage && proofImage.trim() !== "") {
      if (!proofImage.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload a valid image file" },
          { status: 400 },
        )
      }
      // Validate base64 size (approximately 5MB when decoded)
      const base64Size = (proofImage.length * 3) / 4
      if (base64Size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 })
      }
    }

    // Create deposit request
    const depositRequest: DepositRequest = {
      userId: user._id!,
      userName: user.name,
      userEmail: user.email,
      userIdString: user.userId,
      amount,
      status: "pending",
      requestedAt: new Date(),
      transactionHash,
      proofImage: proofImage, // Store base64 string
      notes,
      currency: "USD",
      network,
    }

    await db.collection<DepositRequest>("depositRequests").insertOne(depositRequest)

    return NextResponse.json({
      message: "Deposit request submitted successfully",
      request: depositRequest,
    })
  } catch (error) {
    console.error("Deposit request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

